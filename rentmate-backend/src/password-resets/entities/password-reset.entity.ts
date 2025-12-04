import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'password_resets' })
@Index(['email', 'tokenHash'])
export class PasswordReset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  email: string;

  @Column({ name: 'token_hash', length: 128 })
  tokenHash: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'datetime', nullable: true })
  usedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
