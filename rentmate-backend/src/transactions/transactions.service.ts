// src/transactions/transactions.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
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
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../common/enums/notification-type.enum';

type Actor = { id: number; role: UserRole };

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,

    @InjectRepository(Contract)
    private readonly contractsRepository: Repository<Contract>,

    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ==================== CÁC METHOD CƠ BẢN ====================

  async findAll() {
    return this.transactionsRepository.find({
      relations: ['contract'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['contract'],
    });
    if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);
    return transaction;
  }

  async create(createTransactionDto: CreateTransactionDto) {
    const contract = await this.contractsRepository.findOne({
      where: { id: createTransactionDto.contractId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${createTransactionDto.contractId} not found`);
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

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    const preload = await this.transactionsRepository.preload({ id, ...updateTransactionDto });
    if (!preload) throw new NotFoundException(`Transaction ${id} not found`);
    return this.transactionsRepository.save(preload);
  }

  async remove(id: number) {
    const transaction = await this.transactionsRepository.findOne({ where: { id } });
    if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);
    await this.transactionsRepository.remove(transaction);
  }

  // ==================== CÁC METHOD KHÁC ====================

  async createCheckout(actor: Actor, createTransactionDto: CreateTransactionDto) {
    const contract = await this.contractsRepository.findOne({
      where: { id: createTransactionDto.contractId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${createTransactionDto.contractId} not found`);
    }

    const isAdminOrManager = actor.role === UserRole.Admin || actor.role === UserRole.Manager;
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

    tx.paymentTokenHash = paymentTokenHash;
    tx.paymentUrl = paymentUrl;
    tx.status = TransactionStatus.Pending;

    const saved = await this.transactionsRepository.save(tx);
    return { ...saved, paymentUrl };
  }

  async completeByToken(token: string) {
    const paymentTokenHash = this.hashToken(token);
    const transaction = await this.transactionsRepository.findOne({
      where: { paymentTokenHash },
      relations: ['contract', 'contract.tenant', 'contract.owner'],
    });

    if (!transaction) throw new NotFoundException('Phiên thanh toán không tồn tại');
    if (transaction.status !== TransactionStatus.Pending) throw new BadRequestException('Giao dịch đã được xử lý');

    transaction.status = TransactionStatus.WaitingConfirm;
    transaction.paidAt = new Date();

    const message = `Người thuê đã thanh toán ${this.formatCurrency(transaction.amount)} cho hợp đồng #${transaction.contract?.contractNumber || transaction.contractId}. Vui lòng xác nhận khi đã nhận được tiền.`;

    if (transaction.contract?.owner) {
      await this.notificationsService.create({
        userId: transaction.contract.owner.id,
        title: 'Yêu cầu xác nhận thanh toán',
        message,
        type: NotificationType.Transaction,
      });
    }

    await this.notificationsService.notifyAdmins({
      title: 'Có thanh toán mới cần xác nhận',
      message,
      type: NotificationType.Transaction,
    });

    return this.transactionsRepository.save(transaction);
  }

  async confirmPayment(transactionId: number, actor: Actor) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId },
      relations: ['contract', 'contract.tenant', 'contract.owner'],
    });

    if (!transaction) throw new NotFoundException('Giao dịch không tồn tại');

    const isLandlord = actor.role === UserRole.Landlord && transaction.contract?.ownerId === actor.id;
    const isAdmin = actor.role === UserRole.Admin;

    if (!isLandlord && !isAdmin) throw new ForbiddenException('Bạn không có quyền xác nhận giao dịch này');
    if (transaction.status !== TransactionStatus.WaitingConfirm) throw new BadRequestException('Giao dịch không ở trạng thái chờ xác nhận');

    transaction.status = TransactionStatus.Completed;
    transaction.confirmedBy = actor.id;
    transaction.confirmedAt = new Date();

    const saved = await this.transactionsRepository.save(transaction);

    if (transaction.contract?.tenant) {
      await this.notificationsService.create({
        userId: transaction.contract.tenant.id,
        title: 'Thanh toán đã được xác nhận',
        message: `Chủ trọ đã xác nhận nhận được tiền thuê ${this.formatCurrency(transaction.amount)}. Cảm ơn bạn!`,
        type: NotificationType.Transaction,
      });
    }

    return saved;
  }

  async notifyDepositPayment(contractCode: string) {
    const contract = await this.contractsRepository.findOne({
      where: { contractNumber: contractCode },
      relations: ['owner', 'tenant'],
    });

    if (!contract) throw new NotFoundException('Không tìm thấy hợp đồng');

    const transaction = await this.transactionsRepository.findOne({
      where: { contractId: contract.id, status: TransactionStatus.Pending },
      relations: ['contract', 'contract.owner', 'contract.tenant'],
    });

    if (!transaction) throw new NotFoundException('Không tìm thấy giao dịch đang chờ');

    transaction.status = TransactionStatus.WaitingConfirm;
    transaction.paidAt = new Date();

    if (contract.owner) {
      await this.notificationsService.create({
        userId: contract.owner.id,
        title: 'Yêu cầu xác nhận thanh toán',
        message: `Người thuê đã thanh toán ${this.formatCurrency(transaction.amount)} cho hợp đồng ${contractCode}. Vui lòng xác nhận khi đã nhận được tiền.`,
        type: NotificationType.Transaction,
      });
    }

    return this.transactionsRepository.save(transaction);
  }

  async findByUser(userId: number) {
    return this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.contract', 'contract')
      .leftJoinAndSelect('contract.property', 'property')
      .leftJoinAndSelect('contract.tenant', 'tenant')
      .leftJoinAndSelect('contract.owner', 'owner')
      .where('contract.tenantId = :userId', { userId })
      .orWhere('contract.ownerId = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();
  }

 

  private async generateReference() {
    const candidate = `TX-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const existing = await this.transactionsRepository.findOne({ where: { reference: candidate } });
    return existing ? `${candidate}-${Date.now()}` : candidate;
  }

  private generatePaymentToken() {
    return randomBytes(16).toString('hex');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
