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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("./notifications.service");
const create_notification_dto_1 = require("./dto/create-notification.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const list_notifications_dto_1 = require("./dto/list-notifications.dto");
let NotificationsController = class NotificationsController {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async findAll(query, req) {
        var _a;
        const user = req.user;
        const userId = (_a = query.userId) !== null && _a !== void 0 ? _a : user.id;
        this.ensureOwnership(user, userId);
        const notifications = await this.notificationsService.findByUser({
            userId,
            type: query.type,
            isRead: query.isRead,
            limit: query.limit,
        });
        return {
            success: true,
            data: notifications,
        };
    }
    async unreadCount(query, req) {
        var _a;
        const user = req.user;
        const userId = (_a = query.userId) !== null && _a !== void 0 ? _a : user.id;
        this.ensureOwnership(user, userId);
        const count = await this.notificationsService.countUnread(userId);
        return {
            success: true,
            data: { count },
        };
    }
    async create(createNotificationDto) {
        const notification = await this.notificationsService.create(createNotificationDto);
        return {
            success: true,
            message: 'Notification created',
            data: notification,
        };
    }
    async markAsRead(id, req) {
        const user = req.user;
        const notification = await this.notificationsService.markAsRead(id, user.role === user_role_enum_1.UserRole.Admin ? undefined : user.id);
        return {
            success: true,
            data: notification,
        };
    }
    async remove(id, req) {
        const user = req.user;
        await this.notificationsService.remove(id, user.role === user_role_enum_1.UserRole.Admin ? undefined : user.id);
        return {
            success: true,
            message: 'Notification removed',
        };
    }
    ensureOwnership(user, targetUserId) {
        if (!user) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (user.role === user_role_enum_1.UserRole.Admin) {
            return;
        }
        if (user.id !== targetUserId) {
            throw new common_1.ForbiddenException('You can only access your notifications');
        }
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_notifications_dto_1.ListNotificationsDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_notifications_dto_1.ListNotificationsDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "unreadCount", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.Admin),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_notification_dto_1.CreateNotificationDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "remove", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map