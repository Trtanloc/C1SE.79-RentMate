import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Entity({ name: 'visits' })
export class Visit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  path: string;

  @Column({ nullable: true })
  userId?: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  userRole?: UserRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referrer?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  user?: User;
}
