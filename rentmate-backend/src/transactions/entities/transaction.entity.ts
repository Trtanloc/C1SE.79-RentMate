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

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.Pending,
  })
  status: TransactionStatus;

  @Column({ length: 200, nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}

