import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { StatsModule } from '../stats/stats.module';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminPaymentsService } from './admin-payments.service';
import { Payment } from '../deposit/entities/payment.entity';
import { DepositContract } from '../deposit/entities/deposit-contract.entity';

@Module({
  imports: [StatsModule, UsersModule, TypeOrmModule.forFeature([Payment, DepositContract])],
  controllers: [AdminController, AdminPaymentsController],
  providers: [RolesGuard, JwtAuthGuard, AdminPaymentsService],
})
export class AdminModule {}
