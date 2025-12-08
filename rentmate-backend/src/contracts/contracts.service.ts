import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import { join } from 'path';
import puppeteer from 'puppeteer';
import { Repository } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateAutoContractDto } from './dto/create-auto-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { ContractStatus } from '../common/enums/contract-status.enum';
import {
  buildContractHtml,
  ContractTemplateData,
} from './templates/contract-template';

type Actor = { id: number; role: UserRole };

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractsRepository: Repository<Contract>,
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createContractDto: CreateContractDto) {
    const property = await this.propertiesRepository.findOne({
      where: { id: createContractDto.propertyId },
      relations: ['owner'],
    });
    if (!property) {
      throw new NotFoundException(
        `Property ${createContractDto.propertyId} not found`,
      );
    }

    const tenant = await this.usersRepository.findOne({
      where: { id: createContractDto.tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(
        `Tenant ${createContractDto.tenantId} not found`,
      );
    }

    const ownerId = createContractDto.ownerId ?? property.ownerId;
    const landlord =
      property.owner ||
      (await this.usersRepository.findOne({ where: { id: ownerId } }));
    if (!landlord) {
      throw new NotFoundException(`Landlord ${ownerId} not found`);
    }

    const contractNumber = await this.generateContractNumber();
    const contractHtml = this.buildHtmlFromEntities(
      {
        ...createContractDto,
        ownerId,
        contractNumber,
        listingId: property.id,
      } as Contract,
      property,
      tenant,
      landlord,
    );

    const contract = this.contractsRepository.create({
      ...createContractDto,
      listingId: property.id,
      ownerId,
      contractNumber,
      contractHtml,
    });

    const saved = await this.contractsRepository.save(contract);
    return this.findOne(saved.id);
  }

  async createFromListing(
    tenantId: number,
    dto: CreateAutoContractDto,
  ): Promise<Contract> {
    const property = await this.propertiesRepository.findOne({
      where: { id: dto.listingId },
      relations: ['owner'],
    });
    if (!property) {
      throw new NotFoundException(`Listing ${dto.listingId} not found`);
    }

    const tenant = await this.usersRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const landlord =
      property.owner ||
      (await this.usersRepository.findOne({ where: { id: property.ownerId } }));
    if (!landlord) {
      throw new NotFoundException(`Landlord ${property.ownerId} not found`);
    }

    const startDate =
      dto.startDate ||
      property.availableFrom ||
      new Date().toISOString().slice(0, 10);
    const endDate =
      dto.endDate ||
      (() => {
        const start = new Date(startDate);
        start.setFullYear(start.getFullYear() + 1);
        return start.toISOString().slice(0, 10);
      })();

    const monthlyRent =
      dto.monthlyRent ?? (property.price ? Number(property.price) : 0);
    const depositAmount =
      dto.depositAmount ?? (property.price ? Number(property.price) * 2 : 0);

    const contractNumber = await this.generateContractNumber();
    const contractPayload: Partial<Contract> = {
      contractNumber,
      title: `Hợp đồng thuê ${property.title}`,
      notes: dto.notes,
      propertyId: property.id,
      listingId: property.id,
      tenantId: tenant.id,
      ownerId: landlord.id,
      monthlyRent,
      depositAmount,
      autoRenew: false,
      status: ContractStatus.Draft,
      startDate,
      endDate,
    };

    const contractHtml = this.buildHtmlFromEntities(contractPayload, property, tenant, landlord);

    const entity = this.contractsRepository.create({
      ...contractPayload,
      contractHtml,
    });

    const saved = await this.contractsRepository.save(entity);
    return this.findOne(saved.id);
  }

  findAll() {
    return this.contractsRepository.find({
      relations: ['property', 'tenant', 'owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async findForActor(actor: Actor) {
    const qb = this.contractsRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.property', 'property')
      .leftJoinAndSelect('contract.tenant', 'tenant')
      .leftJoinAndSelect('contract.owner', 'owner')
      .orderBy('contract.createdAt', 'DESC');

    if (actor.role === UserRole.Admin || actor.role === UserRole.Manager) {
      return qb.getMany();
    }

    qb.andWhere(
      'contract.ownerId = :userId OR contract.tenantId = :userId',
      { userId: actor.id },
    );
    return qb.getMany();
  }

  async findOne(id: number) {
    const contract = await this.contractsRepository.findOne({
      where: { id },
      relations: ['property', 'tenant', 'owner', 'transactions'],
    });
    if (!contract) {
      throw new NotFoundException(`Contract ${id} not found`);
    }
    return contract;
  }

  async update(id: number, updateContractDto: UpdateContractDto) {
    const existing = await this.findOne(id);
    const merged = this.contractsRepository.merge(existing, updateContractDto);
    merged.listingId = merged.propertyId;

    const property =
      merged.property ||
      (await this.propertiesRepository.findOne({
        where: { id: merged.propertyId },
        relations: ['owner'],
      }));
    const tenant =
      merged.tenant ||
      (await this.usersRepository.findOne({
        where: { id: merged.tenantId },
      }));
    const landlord =
      merged.owner ||
      (await this.usersRepository.findOne({ where: { id: merged.ownerId } }));

    if (!property || !tenant || !landlord) {
      throw new BadRequestException('Unable to refresh contract parties');
    }

    merged.contractHtml = this.buildHtmlFromEntities(
      merged,
      property,
      tenant,
      landlord,
    );
    const saved = await this.contractsRepository.save(merged);
    return this.findOne(saved.id);
  }

  async remove(id: number) {
    const contract = await this.contractsRepository.findOne({
      where: { id },
    });
    if (!contract) {
      throw new NotFoundException(`Contract ${id} not found`);
    }
    await this.contractsRepository.remove(contract);
  }

  private async generateContractNumber() {
    const prefix = 'RM';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 999)
      .toString()
      .padStart(3, '0');
    const candidate = `${prefix}-${timestamp}-${random}`;
    const exists = await this.contractsRepository.findOne({
      where: { contractNumber: candidate },
    });
    return exists ? `${candidate}-${Date.now()}` : candidate;
  }

  async generatePdf(contractId: number): Promise<Buffer> {
    const contract = await this.findOne(contractId);
    const html = await this.ensureHtml(contract);
    const buffer = await this.renderHtmlToPdf(html);

    await this.writePdfToDisk(contractId, buffer);
    const pdfUrl = this.resolvePdfUrl(contractId);
    if (!contract.contractPdfUrl || contract.contractPdfUrl !== pdfUrl) {
      await this.contractsRepository.update(contractId, {
        contractPdfUrl: pdfUrl,
        contractHtml: html,
      });
    }

    return buffer;
  }

  private buildHtmlFromEntities(
    contract: Partial<Contract>,
    property: Property,
    tenant: User,
    landlord: User,
  ) {
    const template: ContractTemplateData = {
      contractNumber: contract.contractNumber,
      landlord: {
        name: landlord.fullName,
        email: landlord.email,
        phone: landlord.phone,
      },
      tenant: {
        name: tenant.fullName,
        email: tenant.email,
        phone: tenant.phone,
      },
      listing: {
        title: property.title,
        address: property.address,
        area: property.area,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        price: property.price ? Number(property.price) : undefined,
      },
      financial: {
        depositAmount: contract.depositAmount,
        monthlyRent: contract.monthlyRent,
        startDate: contract.startDate,
        endDate: contract.endDate,
      },
      generatedAt: new Date().toISOString(),
    };
    return buildContractHtml(template);
  }

  private async ensureHtml(contract: Contract): Promise<string> {
    if (contract.contractHtml) {
      return contract.contractHtml;
    }
    const property =
      contract.property ||
      (await this.propertiesRepository.findOne({
        where: { id: contract.propertyId },
        relations: ['owner'],
      }));
    const tenant =
      contract.tenant ||
      (await this.usersRepository.findOne({
        where: { id: contract.tenantId },
      }));
    const landlord =
      contract.owner ||
      (await this.usersRepository.findOne({
        where: { id: contract.ownerId },
      }));

    if (!property || !tenant || !landlord) {
      throw new BadRequestException('Missing data to render contract template');
    }
    const html = this.buildHtmlFromEntities(contract, property, tenant, landlord);
    await this.contractsRepository.update(contract.id, { contractHtml: html });
    return html;
  }

  private async renderHtmlToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.emulateMediaType('screen');
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '12mm',
          bottom: '14mm',
          left: '12mm',
          right: '12mm',
        },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private async writePdfToDisk(contractId: number, buffer: Buffer) {
    const dir = join(process.cwd(), 'uploads', 'contracts');
    await fs.mkdir(dir, { recursive: true });
    const filePath = join(dir, `contract-${contractId}.pdf`);
    await fs.writeFile(filePath, buffer);
  }

  private resolvePdfUrl(contractId: number) {
    return `/uploads/contracts/contract-${contractId}.pdf`;
  }
}
