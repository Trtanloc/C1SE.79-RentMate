import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { User } from './users/entities/user.entity';
import { Property } from './properties/entities/property.entity';
import { PropertyPhoto } from './properties/entities/property-photo.entity';
import { PropertyAmenity } from './properties/entities/property-amenity.entity';
import { Contract } from './contracts/entities/contract.entity';
import { Transaction } from './transactions/entities/transaction.entity';
import { Message } from './messages/entities/message.entity';
import { MessagesModule } from './messages/messages.module';
import { AiModule } from './ai/ai.module';
import { Notification } from './notifications/entities/notification.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { StatsModule } from './stats/stats.module';
import { ContractsModule } from './contracts/contracts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { Testimonial } from './testimonials/entities/testimonial.entity';
import { DatabaseModule } from './database/database.module';
import { VerificationCodesModule } from './verification-codes/verification-codes.module';
import { VerificationCode } from './verification-codes/entities/verification-code.entity';
import { MailerModule } from './mail/mailer.module';
import { LandlordApplication } from './landlord-applications/entities/landlord-application.entity';
import { LandlordApplicationsModule } from './landlord-applications/landlord-applications.module';
import { MetadataModule } from './metadata/metadata.module';
import { Favorite } from './favorites/entities/favorite.entity';
import { FavoritesModule } from './favorites/favorites.module';
import { PasswordReset } from './password-resets/entities/password-reset.entity';
import { PasswordResetsModule } from './password-resets/password-resets.module';
import { Review } from './reviews/entities/review.entity';
import { ReviewsModule } from './reviews/reviews.module';
import { Conversation } from './conversations/entities/conversation.entity';
import { ConversationsModule } from './conversations/conversations.module';
import { DepositContract } from './deposit/entities/deposit-contract.entity';
import { Payment } from './deposit/entities/payment.entity';
import { DepositModule } from './deposit/deposit.module';
import { Visit } from './stats/entities/visit.entity';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProd =
          configService.get<string>('NODE_ENV', 'development') === 'production';
        return {
          type: 'mysql',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 3306),
          username: configService.get<string>('DB_USER', 'root'),
          password: configService.get<string>('DB_PASS', '123456'),
          database: configService.get<string>('DB_NAME', 'rentmate'),
          entities: [
            User,
            Property,
            PropertyPhoto,
            PropertyAmenity,
            Contract,
            Transaction,
            Message,
            Notification,
            Testimonial,
            LandlordApplication,
            VerificationCode,
            Favorite,
            PasswordReset,
            Review,
            Conversation,
            DepositContract,
            Payment,
            Visit,
          ],
          synchronize:
            configService.get<string>(
              'DB_SYNCHRONIZE',
              isProd ? 'false' : 'true',
            ) === 'true',
          dropSchema: configService.get<string>('DB_DROP_SCHEMA', 'false') === 'true',
          logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
        };
      },
    }),
    UsersModule,
    AuthModule,
    PropertiesModule,
    MessagesModule,
    AiModule,
    NotificationsModule,
    StatsModule,
    ContractsModule,
    TransactionsModule,
    TestimonialsModule,
    DatabaseModule,
    VerificationCodesModule,
    MailerModule,
    LandlordApplicationsModule,
    MetadataModule,
    FavoritesModule,
    PasswordResetsModule,
    ReviewsModule,
    ConversationsModule,
    DepositModule,
    AdminModule,
  ],
})
export class AppModule {}
