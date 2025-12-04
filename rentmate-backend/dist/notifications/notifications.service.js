"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./entities/notification.entity");
const notification_type_enum_1 = require("../common/enums/notification-type.enum");
const user_entity_1 = require("../users/entities/user.entity");
const mailer_service_1 = require("../mail/mailer.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(notificationsRepository, usersRepository, mailerService) {
        this.notificationsRepository = notificationsRepository;
        this.usersRepository = usersRepository;
        this.mailerService = mailerService;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async create(createNotificationDto) {
        const user = await this.usersRepository.findOne({
            where: { id: createNotificationDto.userId },
        });
        if (!user) {
            throw new common_1.BadRequestException(`User ${createNotificationDto.userId} not found`);
        }
        const entity = this.notificationsRepository.create(createNotificationDto);
        const notification = await this.notificationsRepository.save(entity);
        if (this.shouldSendEmail(notification.type)) {
            await this.dispatchEmail(user, notification);
        }
        return notification;
    }
    findByUser({ userId, type, isRead, limit, }) {
        return this.notificationsRepository.find({
            where: Object.assign(Object.assign({ userId }, (typeof isRead === 'boolean' ? { isRead } : {})), (type ? { type } : {})),
            order: { createdAt: 'DESC' },
            take: limit !== null && limit !== void 0 ? limit : 50,
        });
    }
    countUnread(userId) {
        return this.notificationsRepository.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }
    async markAsRead(notificationId, userId) {
        const notification = await this.notificationsRepository.findOne({
            where: { id: notificationId },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        if (userId && notification.userId !== userId) {
            throw new common_1.ForbiddenException('You can only update your notifications');
        }
        if (notification.isRead) {
            return notification;
        }
        notification.isRead = true;
        return this.notificationsRepository.save(notification);
    }
    async remove(notificationId, userId) {
        const notification = await this.notificationsRepository.findOne({
            where: { id: notificationId },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        if (userId && notification.userId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your notifications');
        }
        await this.notificationsRepository.remove(notification);
    }
    shouldSendEmail(type) {
        return (type === notification_type_enum_1.NotificationType.Transaction || type === notification_type_enum_1.NotificationType.Contract);
    }
    async dispatchEmail(user, notification) {
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
              <p style="font-size:12px;color:#9ca3af;margin:8px 0 0;">Sent via RentMate • ${notification.createdAt}</p>
            </div>
          </div>
        `,
            });
        }
        catch (error) {
            this.logger.error(`Unable to send email notification ${notification.id}`, error instanceof Error ? error.stack : undefined);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        mailer_service_1.MailerService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map