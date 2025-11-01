import { Request } from 'express';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    findByConversationId(conversationId: string, request: Request): Promise<import("./entities/message.entity").Message[]>;
    create(createMessageDto: CreateMessageDto, request: Request): Promise<{
        message: import("./entities/message.entity").Message;
        reply: import("./entities/message.entity").Message | null;
    }>;
    private ensureConversationAccess;
    private getTenantConversationId;
    private assertTenant;
}
