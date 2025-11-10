import { NotificationType } from '../../common/enums/notification-type.enum';
export declare class ListNotificationsDto {
    userId?: number;
    type?: NotificationType;
    isRead?: boolean;
    limit?: number;
}
