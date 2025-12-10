import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';
import { DepositStatus } from '../../common/enums/deposit-status.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { Payment } from './payment.entity';

@Entity({ name: 'deposit_contracts' })
export class DepositContract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  contract_code: string;

  @Column()
  property_id: number;

  @ManyToOne(() => Property, (property) => property.depositContracts)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column()
  tenant_id: number;

  @ManyToOne(() => User, (user) => user.tenantDepositContracts)
  @JoinColumn({ name: 'tenant_id' })
  tenant: User;

  @Column()
  landlord_id: number;

  @ManyToOne(() => User, (user) => user.landlordDepositContracts)
  @JoinColumn({ name: 'landlord_id' })
  landlord: User;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  deposit_amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.MoMo,
  })
  payment_method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: DepositStatus,
    default: DepositStatus.Pending,
  })
  status: DepositStatus;

  @Column({ type: 'text', nullable: true })
  qr_data?: string;

  @Column({ type: 'text', nullable: true })
  payment_url?: string;

  @Column({ length: 100, nullable: true })
  transaction_id?: string;

  @Column({ type: 'json', nullable: true })
  contract_details?: any;

  @Column({ type: 'datetime', nullable: true })
  expires_at?: Date;

  @Column({ type: 'datetime', nullable: true })
  paid_at?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  contract_pdf_path?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  contract_pdf_url?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Payment, (payment) => payment.contract)
  payments: Payment[];
}
