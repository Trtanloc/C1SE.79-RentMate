import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(query: ListNotificationsDto, req: Request): Promise<{
        success: boolean;
        data: import("./entities/notification.entity").Notification[];
    }>;
    unreadCount(query: ListNotificationsDto, req: Request): Promise<{
        success: boolean;
        data: {
            count: number;
        };
    }>;
    create(createNotificationDto: CreateNotificationDto): Promise<{
        success: boolean;
        message: string;
        data: import("./entities/notification.entity").Notification;
    }>;
    markAsRead(id: number, req: Request): Promise<{
        success: boolean;
        data: import("./entities/notification.entity").Notification;
    }>;
    remove(id: number, req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
    private ensureOwnership;
}
