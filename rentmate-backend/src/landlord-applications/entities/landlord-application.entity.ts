import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LandlordApplicationStatus } from '../../common/enums/landlord-application-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'landlord_applications' })
export class LandlordApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.landlordApplications, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({
    type: 'enum',
    enum: LandlordApplicationStatus,
    default: LandlordApplicationStatus.Pending,
  })
  status: LandlordApplicationStatus;

  @Column({ length: 120 })
  companyName: string;

  @Column({ length: 255, nullable: true })
  portfolioUrl?: string;

  @Column({ type: 'int', default: 0 })
  experienceYears: number;

  @Column({ type: 'int', default: 1 })
  propertyCount: number;

  @Column({ type: 'text' })
  motivation: string;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string;

  @Column({ type: 'int', nullable: true })
  reviewedByUserId?: number;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

