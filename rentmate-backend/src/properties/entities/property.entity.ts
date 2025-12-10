import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PropertyStatus } from '../../common/enums/property-status.enum';
import { PropertyType } from '../../common/enums/property-type.enum';
import { Contract } from '../../contracts/entities/contract.entity';
import { PropertyPhoto } from './property-photo.entity';
import { PropertyAmenity } from './property-amenity.entity';
import { DepositContract } from '../../deposit/entities/deposit-contract.entity';

@Entity({ name: 'properties' })
@Index('IDX_PROPERTY_SLUG', ['slug'], { unique: true })
export class Property {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ownerId: number;

  @ManyToOne(() => User, (user) => user.properties, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 200, unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: PropertyType,
    default: PropertyType.Apartment,
  })
  type: PropertyType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ length: 120 })
  city: string;

  @Column({ length: 120 })
  district: string;

  @Column({ length: 120, nullable: true })
  ward?: string;

  @Column({ length: 120 })
  country: string;

  @Column({ length: 120 })
  ward: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'float' })
  area: number;

  @Column({ type: 'int', default: 1 })
  bedrooms: number;

  @Column({ type: 'int', default: 1 })
  bathrooms: number;

  @Column({ type: 'float', nullable: true })
  latitude?: number;

  @Column({ type: 'float', nullable: true })
  longitude?: number;

  @Column({ length: 500, nullable: true })
  mapEmbedUrl?: string;

  @Column({ length: 500, nullable: true })
  virtualTourUrl?: string;

  @Column({ type: 'date', nullable: true })
  availableFrom?: string;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({
    type: 'enum',
    enum: PropertyStatus,
    default: PropertyStatus.Available,
  })
  status: PropertyStatus;

  @OneToMany(() => PropertyPhoto, (photo) => photo.property, {
    cascade: true,
    eager: true,
  })
  photos: PropertyPhoto[];

  @OneToMany(() => PropertyAmenity, (amenity) => amenity.property, {
    cascade: true,
    eager: true,
  })
  amenities: PropertyAmenity[];

  @OneToMany(() => Contract, (contract) => contract.property)
  contracts: Contract[];

  @OneToMany(() => DepositContract, (contract) => contract.property)
  depositContracts: DepositContract[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
