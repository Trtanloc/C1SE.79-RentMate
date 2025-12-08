import { Expose } from 'class-transformer';
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
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../users/entities/user.entity';
import { ContractStatus } from '../../common/enums/contract-status.enum';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity({ name: 'contracts' })
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  contractNumber: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ nullable: true })
  listingId?: number;

  @Column()
  propertyId: number;

  @ManyToOne(() => Property, (property) => property.contracts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  tenantId: number;

  @ManyToOne(() => User, (user) => user.contractsAsTenant, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: User;

  @Column()
  ownerId: number;

  @Expose()
  get landlordId(): number {
    return this.ownerId;
  }

  @ManyToOne(() => User, (user) => user.contractsAsOwner, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monthlyRent: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  depositAmount: number;

  @Column({ default: false })
  autoRenew: boolean;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.Draft,
  })
  status: ContractStatus;

  @Column({ type: 'date', nullable: true })
  startDate?: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column({ type: 'timestamp', nullable: true })
  signedAt?: Date;

  @Column({ type: 'text', nullable: true })
  contractHtml?: string;

  @Column({ length: 300, nullable: true })
  contractPdfUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.contract, {
    cascade: false,
  })
  transactions: Transaction[];
}
