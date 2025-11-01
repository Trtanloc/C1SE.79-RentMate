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

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.Tenant,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

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
}
