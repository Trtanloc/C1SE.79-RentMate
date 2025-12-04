import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Contract } from '../contracts/entities/contract.entity';
import { ConfigService } from '@nestjs/config';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { UserRole } from '../common/enums/user-role.enum';

type Actor = { id: number; role: UserRole };

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Contract)
    private readonly contractsRepository: Repository<Contract>,
    private readonly configService: ConfigService,
  ) {}

  async createCheckout(actor: Actor, createTransactionDto: CreateTransactionDto) {
    const contract = await this.contractsRepository.findOne({
      where: { id: createTransactionDto.contractId },
    });

    if (!contract) {
      throw new NotFoundException(
        `Contract ${createTransactionDto.contractId} not found`,
      );
    }

    const isAdminOrManager =
      actor.role === UserRole.Admin || actor.role === UserRole.Manager;
    if (!isAdminOrManager) {
      const isOwner = actor.role === UserRole.Landlord && contract.ownerId === actor.id;
      const isTenant = actor.role === UserRole.Tenant && contract.tenantId === actor.id;
      if (!isOwner && !isTenant) {
        throw new ForbiddenException('You cannot create a checkout for this contract');
      }
    }

    const tx = this.transactionsRepository.create({
      ...createTransactionDto,
      contractId: contract.id,
      currency: createTransactionDto.currency ?? 'VND',
      method: createTransactionDto.method ?? 'online',
      paymentProvider: createTransactionDto.paymentProvider ?? 'manual',
      reference: await this.generateReference(),
      status: TransactionStatus.Pending,
    });

    const paymentToken = this.generatePaymentToken();
    const paymentTokenHash = this.hashToken(paymentToken);
    const apiBase =
      this.configService.get<string>('API_BASE_URL') ||
      this.configService.get<string>('APP_BASE_URL') ||
      'http://localhost:3000';
    const paymentUrl = `${apiBase.replace(/\/+$/, '')}/transactions/pay/${paymentToken}`;
    tx.paymentTokenHash = tx.paymentTokenHash ?? paymentTokenHash;
    tx.paymentUrl = tx.paymentUrl || paymentUrl;
    tx.status = TransactionStatus.Pending;
    const saved = await this.transactionsRepository.save(tx);
    return {
      ...saved,
      paymentUrl,
    };
  }

  async create(createTransactionDto: CreateTransactionDto) {
    const contract = await this.contractsRepository.findOne({
      where: { id: createTransactionDto.contractId },
    });

    if (!contract) {
      throw new NotFoundException(
        `Contract ${createTransactionDto.contractId} not found`,
      );
    }

    const transaction = this.transactionsRepository.create({
      ...createTransactionDto,
      currency: createTransactionDto.currency ?? 'VND',
      method: createTransactionDto.method ?? 'bank-transfer',
      paymentProvider: createTransactionDto.paymentProvider ?? 'manual',
      reference: await this.generateReference(),
    });

    return this.transactionsRepository.save(transaction);
  }

  findAll() {
    return this.transactionsRepository.find({
      relations: ['contract'],
      order: { createdAt: 'DESC' },
    });
  }

  async findForActor(actor: Actor) {
    const qb = this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.contract', 'contract')
      .leftJoinAndSelect('contract.property', 'property')
      .orderBy('transaction.createdAt', 'DESC');

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
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['contract'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
    return transaction;
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    const preload = await this.transactionsRepository.preload({
      id,
      ...updateTransactionDto,
    });
    if (!preload) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
    return this.transactionsRepository.save(preload);
  }

  async remove(id: number) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
    await this.transactionsRepository.remove(transaction);
  }

  async completeByToken(token: string) {
    const paymentTokenHash = this.hashToken(token);
    const transaction = await this.transactionsRepository.findOne({
      where: { paymentTokenHash },
      relations: ['contract'],
    });
    if (!transaction) {
      throw new NotFoundException('Payment session not found');
    }
    const allowedStatuses = [
      TransactionStatus.Pending,
      TransactionStatus.Processing,
    ];
    if (!allowedStatuses.includes(transaction.status)) {
      throw new BadRequestException('Payment session is no longer valid');
    }

    const ttlMinutes =
      Number(this.configService.get<string>('PAYMENT_TOKEN_TTL_MINUTES', '30')) ||
      30;
    const expiresAt = new Date(
      transaction.createdAt.getTime() + ttlMinutes * 60 * 1000,
    );
    if (Date.now() > expiresAt.getTime()) {
      throw new BadRequestException('Payment session has expired');
    }

    transaction.status = TransactionStatus.Completed;
    transaction.paidAt = new Date();
    return this.transactionsRepository.save(transaction);
  }

  private async generateReference() {
    const candidate = `TX-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const existing = await this.transactionsRepository.findOne({
      where: { reference: candidate },
    });
    return existing ? `${candidate}-${Date.now()}` : candidate;
  }

  private generatePaymentToken() {
    return randomBytes(16).toString('hex');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
