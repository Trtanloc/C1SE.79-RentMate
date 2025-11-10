import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from '../common/enums/notification-type.enum';
import { User } from '../users/entities/user.entity';
type FindNotificationsOptions = {
    userId: number;
    type?: NotificationType;
    isRead?: boolean;
    limit?: number;
};
export declare class NotificationsService {
    private readonly notificationsRepository;
    private readonly usersRepository;
    private readonly configService;
    private readonly logger;
    private readonly transporter?;
    private readonly senderAddress?;
    constructor(notificationsRepository: Repository<Notification>, usersRepository: Repository<User>, configService: ConfigService);
    create(createNotificationDto: CreateNotificationDto): Promise<Notification>;
    findByUser({ userId, type, isRead, limit, }: FindNotificationsOptions): Promise<Notification[]>;
    countUnread(userId: number): Promise<number>;
    markAsRead(notificationId: number, userId?: number): Promise<Notification>;
    remove(notificationId: number, userId?: number): Promise<void>;
    private shouldSendEmail;
    private dispatchEmail;
}
export {};
