import { Request } from 'express';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ConversationsService } from '../conversations/conversations.service';
export declare class MessagesController {
    private readonly messagesService;
    private readonly conversationsService;
    constructor(messagesService: MessagesService, conversationsService: ConversationsService);
    findByConversationId(conversationId: string, request: Request): Promise<import("./entities/message.entity").Message[]>;
    create(createMessageDto: CreateMessageDto, request: Request): Promise<{
        message: import("./entities/message.entity").Message;
        reply: import("./entities/message.entity").Message | null;
    }>;
    private resolveSenderType;
}
