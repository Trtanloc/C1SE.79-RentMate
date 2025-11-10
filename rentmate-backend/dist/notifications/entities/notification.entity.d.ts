import { User } from '../../users/entities/user.entity';
import { NotificationType } from '../../common/enums/notification-type.enum';
export declare class Notification {
    id: number;
    userId: number;
    user: User;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: Date;
}
