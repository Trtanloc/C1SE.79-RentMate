import { MessageSender } from '../../common/enums/message-sender.enum';
export declare class Message {
    id: number;
    conversationId: string;
    senderId?: number;
    senderType: MessageSender;
    content: string;
    mode?: string;
    createdAt: Date;
}
