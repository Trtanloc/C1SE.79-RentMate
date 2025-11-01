import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageSender } from '../common/enums/message-sender.enum';

type LogMessageInput = {
  conversationId: string;
  content: string;
  senderId?: number;
  senderType?: MessageSender;
  mode?: string;
};

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
  ) {}

  async findByConversationId(conversationId: string): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async create(
    createMessageDto: CreateMessageDto,
  ): Promise<{ message: Message; reply: Message | null }> {
    if (!createMessageDto.conversationId) {
      throw new BadRequestException('Conversation ID is required');
    }

    const conversationId = createMessageDto.conversationId;

    const message = await this.logMessage({
      conversationId,
      content: createMessageDto.content,
      senderId: createMessageDto.senderId,
      senderType: createMessageDto.senderType ?? MessageSender.Tenant,
      mode: createMessageDto.mode,
    });

    let reply: Message | null = null;
    if (createMessageDto.replyContent) {
      reply = await this.logMessage({
        conversationId,
        content: createMessageDto.replyContent,
        senderId: createMessageDto.replySenderId,
        senderType: createMessageDto.replySenderType ?? MessageSender.Assistant,
        mode: createMessageDto.mode,
      });
    }

    return { message, reply };
  }

  async logMessage(input: LogMessageInput): Promise<Message> {
    const entity = this.messagesRepository.create({
      conversationId: input.conversationId,
      content: input.content,
      senderId: input.senderId,
      senderType: input.senderType ?? MessageSender.Tenant,
      mode: input.mode,
    });

    return this.messagesRepository.save(entity);
  }
}
