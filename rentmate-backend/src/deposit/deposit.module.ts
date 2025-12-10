// src/deposit/deposit.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { DepositAdminController } from './deposit-admin.controller';
import { DepositContract } from './entities/deposit-contract.entity';
import { Payment } from './entities/payment.entity';
import { PdfModule } from '../pdf/pdf.module';
import { UsersModule } from '../users/users.module';
import { PropertiesModule } from '../properties/properties.module';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DepositContract, Payment]),
    ScheduleModule.forRoot(),
    forwardRef(() => PdfModule),
    UsersModule,
    PropertiesModule,
    ConfigModule,
    NotificationsModule,
  ],
  controllers: [DepositController, DepositAdminController],
  providers: [DepositService],
  exports: [DepositService],
})
export class DepositModule {}