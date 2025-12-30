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
import { LandlordApplication } from '../landlord-applications/entities/landlord-application.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { VerificationCode } from '../verification-codes/entities/verification-code.entity';
import { PasswordReset } from '../password-resets/entities/password-reset.entity';
import { Review } from '../reviews/entities/review.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { DepositContract } from '../deposit/entities/deposit-contract.entity';
import { Payment } from '../deposit/entities/payment.entity';
import { Visit } from '../stats/entities/visit.entity';
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
      LandlordApplication,
      Favorite,
      VerificationCode,
      PasswordReset,
      Review,
      Conversation,
      DepositContract,
      Payment,
      Visit,
    ]),
  ],
  providers: [DatabaseSeedService, SchemaPatchService],
})
export class DatabaseModule {}
