import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MailerModule } from '../mail/mailer.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User]), MailerModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, RolesGuard, JwtAuthGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
