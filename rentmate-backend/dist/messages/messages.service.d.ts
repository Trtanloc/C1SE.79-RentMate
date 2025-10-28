import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageSender } from '../common/enums/message-sender.enum';
export interface LogMessageInput {
    conversationId: string;
    content: string;
    senderId?: number;
    senderType?: MessageSender;
    mode?: string;
}
export declare class MessagesService {
    private readonly messagesRepository;
    constructor(messagesRepository: Repository<Message>);
    findByConversationId(conversationId: string): Promise<Message[]>;
    create(createMessageDto: CreateMessageDto): Promise<{
        message: Message;
        reply: any;
    }>;
    logMessage(input: LogMessageInput): Promise<Message>;
}
