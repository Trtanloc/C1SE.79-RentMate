import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'testimonials' })
export class Testimonial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  authorName: string;

  @Column({ length: 120 })
  authorRole: string;

  @Column({ length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'int', default: 5 })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;
}
