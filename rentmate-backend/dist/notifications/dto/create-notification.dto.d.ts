import { NotificationType } from '../../common/enums/notification-type.enum';
export declare class CreateNotificationDto {
    userId: number;
    title: string;
    message: string;
    type: NotificationType;
}
