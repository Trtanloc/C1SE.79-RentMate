import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
// Lazy import to avoid crashing app if pdfkit is not installed; resolved at runtime in generatePdf.
let PDFDocument: any;

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

    const contract = this.contractsRepository.create({
      ...createContractDto,
      ownerId,
      contractNumber: await this.generateContractNumber(),
    });

    return this.contractsRepository.save(contract);
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
    const preload = await this.contractsRepository.preload({
      id,
      ...updateContractDto,
    });
    if (!preload) {
      throw new NotFoundException(`Contract ${id} not found`);
    }
    return this.contractsRepository.save(preload);
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
    if (!PDFDocument) {
      try {
        // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
        PDFDocument = require('pdfkit');
      } catch (error) {
        throw new Error(
          'pdfkit is not installed. Run "npm install pdfkit" in rentmate-backend.',
        );
      }
    }

    const contract = await this.findOne(contractId);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', () => {
      // swallow errors to avoid crashing caller
    });

    doc.fontSize(20).text('RentMate Lease Agreement', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Contract #: ${contract.contractNumber}`);
    doc.text(`Property: ${contract.property?.title ?? ''}`);
    doc.text(`Address: ${contract.property?.address ?? ''}`);
    doc.text(
      `Tenant: ${contract.tenant?.fullName ?? ''} (${contract.tenant?.email})`,
    );
    doc.text(
      `Landlord: ${contract.owner?.fullName ?? ''} (${contract.owner?.email})`,
    );
    doc.text(`Monthly Rent: ${contract.monthlyRent}`);
    doc.text(`Deposit: ${contract.depositAmount}`);
    doc.text(`Start: ${contract.startDate ?? '--'}`);
    doc.text(`End: ${contract.endDate ?? '--'}`);
    if (contract.notes) {
      doc.moveDown().text('Notes:');
      doc.text(contract.notes);
    }
    doc.end();

    return await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
