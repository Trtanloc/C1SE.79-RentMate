import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Contract } from '../../contracts/entities/contract.entity';
import { TransactionStatus } from '../../common/enums/transaction-status.enum';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contractId: number;

  @ManyToOne(() => Contract, (contract) => contract.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contractId' })
  contract: Contract;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'VND' })
  currency: string;

  @Column({ length: 40, nullable: true })
  reference?: string;

  @Column({ length: 40, default: 'manual' })
  paymentProvider: string;

  @Column({ length: 120, nullable: true })
  paymentIntentId?: string;

  @Column({ length: 500, nullable: true })
  paymentUrl?: string;

  @Column({ name: 'payment_token_hash', length: 128, nullable: true })
  paymentTokenHash?: string;

  @Column({ length: 40, default: 'bank-transfer' })
  method: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.Pending,
  })
  status: TransactionStatus;

  @Column({ length: 200, nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ type: 'text', nullable: true })
  metadata?: string;

  @CreateDateColumn()
  createdAt: Date;
}

