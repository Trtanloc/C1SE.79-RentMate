import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { PropertyPhoto } from '../properties/entities/property-photo.entity';
import { PropertyAmenity } from '../properties/entities/property-amenity.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Message } from '../messages/entities/message.entity';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { DatabaseSeedService } from './database.seed.service';
import { SchemaPatchService } from './schema-patch.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Property,
      PropertyPhoto,
      PropertyAmenity,
      Contract,
      Transaction,
      Notification,
      Message,
      Testimonial,
    ]),
  ],
  providers: [DatabaseSeedService, SchemaPatchService],
})
export class DatabaseModule {}
