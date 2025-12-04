import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandlordApplication } from './entities/landlord-application.entity';
import { LandlordApplicationsService } from './landlord-applications.service';
import { LandlordApplicationsController } from './landlord-applications.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([LandlordApplication]),
    UsersModule,
    NotificationsModule,
  ],
  providers: [LandlordApplicationsService, RolesGuard, JwtAuthGuard],
  controllers: [LandlordApplicationsController],
  exports: [LandlordApplicationsService],
})
export class LandlordApplicationsModule {}

