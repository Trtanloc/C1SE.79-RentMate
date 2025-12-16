import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'reviews' })
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  propertyId?: number;

  @Column({ nullable: true })
  tenantId?: number;

  @Column({ nullable: true })
  landlordId?: number;

  @Column({ length: 120, nullable: true })
  reviewerName?: string;

  @Column({ length: 50, nullable: true })
  reviewerRole?: string;

  @Column({ length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: true })
  isApproved: boolean;

  @Column({ type: 'int', default: 5 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
