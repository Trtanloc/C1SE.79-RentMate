import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from '../common/enums/notification-type.enum';
import { User } from '../users/entities/user.entity';
import { MailerService } from '../mail/mailer.service';

type FindNotificationsOptions = {
  userId: number;
  type?: NotificationType;
  isRead?: boolean;
  limit?: number;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly mailerService: MailerService,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const user = await this.usersRepository.findOne({
      where: { id: createNotificationDto.userId },
    });
    if (!user) {
      throw new BadRequestException(
        `User ${createNotificationDto.userId} not found`,
      );
    }

    const entity = this.notificationsRepository.create(createNotificationDto);
    const notification = await this.notificationsRepository.save(entity);

    if (this.shouldSendEmail(notification.type)) {
      await this.dispatchEmail(user, notification);
    }

    return notification;
  }

  findByUser({
    userId,
    type,
    isRead,
    limit,
  }: FindNotificationsOptions): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: {
        userId,
        ...(typeof isRead === 'boolean' ? { isRead } : {}),
        ...(type ? { type } : {}),
      },
      order: { createdAt: 'DESC' },
      take: limit ?? 50,
    });
  }

  countUnread(userId: number): Promise<number> {
    return this.notificationsRepository.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(
    notificationId: number,
    userId?: number,
  ): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (userId && notification.userId !== userId) {
      throw new ForbiddenException('You can only update your notifications');
    }

    if (notification.isRead) {
      return notification;
    }

    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async remove(notificationId: number, userId?: number): Promise<void> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (userId && notification.userId !== userId) {
      throw new ForbiddenException('You can only delete your notifications');
    }

    await this.notificationsRepository.remove(notification);
  }

  private shouldSendEmail(type: NotificationType): boolean {
    return (
      type === NotificationType.Transaction || type === NotificationType.Contract
    );
  }

  private async dispatchEmail(user: User, notification: Notification) {
    try {
      await this.mailerService.send({
        to: user.email,
        subject: notification.title,
        html: `
          <div style="font-family:Arial,sans-serif;padding:16px;background-color:#f8f8f8;">
            <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
              <p style="font-size:14px;color:#6b7280;margin:0 0 8px;">Hi ${user.fullName},</p>
              <p style="font-size:16px;color:#111827;margin:0 0 16px;">${notification.message}</p>
              <p style="font-size:13px;color:#9ca3af;margin:0;">Type: <strong>${notification.type}</strong></p>
              <p style="font-size:12px;color:#9ca3af;margin:8px 0 0;">Sent via RentMate • ${
                notification.createdAt
              }</p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Unable to send email notification ${notification.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
