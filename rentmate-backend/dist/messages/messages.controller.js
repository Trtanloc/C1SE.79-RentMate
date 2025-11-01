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
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const messages_service_1 = require("./messages.service");
const create_message_dto_1 = require("./dto/create-message.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const message_sender_enum_1 = require("../common/enums/message-sender.enum");
let MessagesController = class MessagesController {
    constructor(messagesService) {
        this.messagesService = messagesService;
    }
    findByConversationId(conversationId, request) {
        const tenant = this.assertTenant(request.user);
        const expectedConversationId = this.getTenantConversationId(tenant);
        this.ensureConversationAccess(conversationId, expectedConversationId);
        return this.messagesService.findByConversationId(conversationId);
    }
    create(createMessageDto, request) {
        var _a;
        const tenant = this.assertTenant(request.user);
        const expectedConversationId = this.getTenantConversationId(tenant);
        const conversationId = (_a = createMessageDto.conversationId) !== null && _a !== void 0 ? _a : expectedConversationId;
        this.ensureConversationAccess(conversationId, expectedConversationId);
        return this.messagesService.create(Object.assign(Object.assign({}, createMessageDto), { conversationId, senderId: tenant.id, senderType: message_sender_enum_1.MessageSender.Tenant }));
    }
    ensureConversationAccess(conversationId, expectedConversationId) {
        if (conversationId !== expectedConversationId) {
            throw new common_1.ForbiddenException('You cannot access this conversation.');
        }
    }
    getTenantConversationId(user) {
        return `tenant-${user.id}`;
    }
    assertTenant(user) {
        if (!user || user.role !== user_role_enum_1.UserRole.Tenant) {
            throw new common_1.ForbiddenException('Only tenants can access this chat history.');
        }
        return user;
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Get)(':conversationId'),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "findByConversationId", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_message_dto_1.CreateMessageDto, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "create", null);
exports.MessagesController = MessagesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('messages'),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map