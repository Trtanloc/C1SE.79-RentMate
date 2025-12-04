import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from './property.entity';

@Entity({ name: 'property_photos' })
export class PropertyPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  propertyId: number;

  @ManyToOne(() => Property, (property) => property.photos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ length: 50 })
  url: string;

  @Column({ length: 150, nullable: true })
  caption?: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
