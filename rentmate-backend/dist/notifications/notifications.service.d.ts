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
export declare class NotificationsService {
    private readonly notificationsRepository;
    private readonly usersRepository;
    private readonly mailerService;
    private readonly logger;
    constructor(notificationsRepository: Repository<Notification>, usersRepository: Repository<User>, mailerService: MailerService);
    create(createNotificationDto: CreateNotificationDto): Promise<Notification>;
    findByUser({ userId, type, isRead, limit, }: FindNotificationsOptions): Promise<Notification[]>;
    countUnread(userId: number): Promise<number>;
    markAsRead(notificationId: number, userId?: number): Promise<Notification>;
    remove(notificationId: number, userId?: number): Promise<void>;
    private shouldSendEmail;
    private dispatchEmail;
}
export {};
