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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const message_entity_1 = require("./entities/message.entity");
const message_sender_enum_1 = require("../common/enums/message-sender.enum");
const conversations_service_1 = require("../conversations/conversations.service");
let MessagesService = class MessagesService {
    constructor(messagesRepository, conversationsService) {
        this.messagesRepository = messagesRepository;
        this.conversationsService = conversationsService;
    }
    async findByConversationId(conversationId) {
        return this.messagesRepository.find({
            where: { conversationId },
            order: { createdAt: 'ASC' },
        });
    }
    async create(createMessageDto) {
        var _a, _b;
        if (!createMessageDto.conversationId) {
            throw new common_1.BadRequestException('Conversation ID is required');
        }
        const conversationId = createMessageDto.conversationId;
        const message = await this.logMessage({
            conversationId,
            content: createMessageDto.content,
            senderId: createMessageDto.senderId,
            senderType: (_a = createMessageDto.senderType) !== null && _a !== void 0 ? _a : message_sender_enum_1.MessageSender.Tenant,
            mode: createMessageDto.mode,
        });
        let reply = null;
        if (createMessageDto.replyContent) {
            reply = await this.logMessage({
                conversationId,
                content: createMessageDto.replyContent,
                senderId: createMessageDto.replySenderId,
                senderType: (_b = createMessageDto.replySenderType) !== null && _b !== void 0 ? _b : message_sender_enum_1.MessageSender.Assistant,
                mode: createMessageDto.mode,
            });
        }
        await this.conversationsService.touch(conversationId);
        return { message, reply };
    }
    async logMessage(input) {
        var _a;
        const entity = this.messagesRepository.create({
            conversationId: input.conversationId,
            content: input.content,
            senderId: input.senderId,
            senderType: (_a = input.senderType) !== null && _a !== void 0 ? _a : message_sender_enum_1.MessageSender.Tenant,
            mode: input.mode,
        });
        return this.messagesRepository.save(entity);
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        conversations_service_1.ConversationsService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map