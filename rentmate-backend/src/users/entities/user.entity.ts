import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { Contract } from '../../contracts/entities/contract.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { LandlordApplication } from '../../landlord-applications/entities/landlord-application.entity';
import { DepositContract } from '../../deposit/entities/deposit-contract.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  fullName: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 255, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ length: 80, nullable: true, unique: true })
  facebookId?: string;

  @Column({ length: 20, nullable: true })
  idNumber?: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ length: 50, nullable: true })
  bankAccount?: string;

  @Column({ length: 100, nullable: true })
  bankName?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.Tenant,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  emailVerifiedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Property, (property) => property.owner)
  properties: Property[];

  @OneToMany(() => Contract, (contract) => contract.tenant)
  contractsAsTenant: Contract[];

  @OneToMany(() => Contract, (contract) => contract.owner)
  contractsAsOwner: Contract[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(
    () => LandlordApplication,
    (application) => application.user,
  )
  landlordApplications: LandlordApplication[];

  @OneToMany(() => DepositContract, (contract) => contract.tenant)
  tenantDepositContracts: DepositContract[];

  @OneToMany(() => DepositContract, (contract) => contract.landlord)
  landlordDepositContracts: DepositContract[];
}
