import { MessageSender } from '../../common/enums/message-sender.enum';
export declare class CreateMessageDto {
    conversationId?: string;
    senderId?: number;
    content: string;
    senderType?: MessageSender;
    replyContent?: string;
    replySenderId?: number;
    replySenderType?: MessageSender;
    mode?: string;
}
