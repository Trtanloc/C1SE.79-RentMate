import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../deposit/entities/payment.entity';
import { DepositContract } from '../deposit/entities/deposit-contract.entity';
import { DepositStatus } from '../common/enums/deposit-status.enum';

@Injectable()
export class AdminPaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(DepositContract)
    private readonly contractRepo: Repository<DepositContract>,
  ) {}

  async searchPayments(search?: string) {
    const normalizedSearch = search?.trim();
    const searchValue = normalizedSearch?.replace(/^PAY-?/i, '') || normalizedSearch;

    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.contract', 'contract')
      .leftJoinAndSelect('contract.tenant', 'tenant')
      .leftJoinAndSelect('contract.landlord', 'landlord')
      .orderBy('payment.created_at', 'DESC');

    if (searchValue) {
      const like = `%${searchValue}%`;
      qb.andWhere(
        '(payment.id LIKE :like OR contract.contract_code LIKE :like OR tenant.fullName LIKE :like)',
        { like },
      );
    }

    const payments = await qb.getMany();
    return payments.map((payment) => ({
      id: payment.id,
      paymentCode: `PAY-${payment.id}`,
      contractCode: payment.contract?.contract_code,
      tenantName: payment.contract?.tenant?.fullName,
      landlordName: payment.contract?.landlord?.fullName,
      status: payment.status,
      amount: payment.amount,
      method: payment.payment_method,
      createdAt: payment.created_at,
      contractStatus: payment.contract?.status,
    }));
  }

  async cancelPayment(id: number, adminId: number) {
    const payment = await this.findPaymentOrFail(id);
    this.ensureNotPaid(payment);
    this.ensurePending(payment);

    payment.status = 'cancelled';
    payment.gateway_response = {
      ...(payment.gateway_response || {}),
      cancelledByAdminId: adminId,
      cancelledAt: new Date().toISOString(),
    };

    await this.updateContractIfPending(payment.contract_id, DepositStatus.Cancelled);
    return this.paymentRepo.save(payment);
  }

  async deletePayment(id: number, adminId: number) {
    const payment = await this.findPaymentOrFail(id);
    this.ensureNotPaid(payment);
    this.ensurePending(payment);

    payment.status = 'cancelled';
    payment.gateway_response = {
      ...(payment.gateway_response || {}),
      deleted: true,
      deletedByAdminId: adminId,
      deletedAt: new Date().toISOString(),
    };

    await this.updateContractIfPending(payment.contract_id, DepositStatus.Cancelled);
    return this.paymentRepo.save(payment);
  }

  private async findPaymentOrFail(id: number) {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: ['contract'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return payment;
  }

  private ensureNotPaid(payment: Payment) {
    const status = (payment.status || '').toLowerCase();
    if (status === 'paid' || status === 'completed') {
      throw new BadRequestException('Đã thanh toán – không thể xóa hoặc hủy');
    }
  }

  private ensurePending(payment: Payment) {
    const status = (payment.status || '').toLowerCase();
    if (status !== 'pending' && status !== 'unpaid') {
      throw new BadRequestException('Chỉ được hủy/xóa khoản chưa thanh toán');
    }
  }

  private async updateContractIfPending(contractId: number, nextStatus: DepositStatus) {
    if (!contractId) return;
    const contract = await this.contractRepo.findOne({ where: { id: contractId } });
    if (!contract) return;

    if (
      contract.status === DepositStatus.Pending ||
      contract.status === DepositStatus.WaitingConfirmation
    ) {
      contract.status = nextStatus;
      await this.contractRepo.save(contract);
    }
  }
}
