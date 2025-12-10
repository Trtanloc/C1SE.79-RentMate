import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { VerificationCode } from './entities/verification-code.entity';
import { VerificationCodesService } from './verification-codes.service';
import { UsersModule } from '../users/users.module';
import { MailerModule } from '../mail/mailer.module';


@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([VerificationCode]),
    UsersModule,
    MailerModule,
  ],
  providers: [VerificationCodesService],
  exports: [VerificationCodesService],
})
export class VerificationCodesModule { }
