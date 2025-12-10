import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DepositContract } from './deposit-contract.entity';

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contract_id: number;

  @ManyToOne(() => DepositContract, (contract) => contract.payments)
  @JoinColumn({ name: 'contract_id' })
  contract: DepositContract;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 50 })
  payment_method: string;

  @Column({ length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'json', nullable: true })
  gateway_response?: any;

  @CreateDateColumn()
  created_at: Date;
}




