import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { MessageSender } from '../common/enums/message-sender.enum';
import { ConversationsService } from '../conversations/conversations.service';

type RequestUser = {
  id: number;
  role: UserRole;
  fullName?: string;
};

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly conversationsService: ConversationsService,
  ) {}

  @Get(':conversationId')
  findByConversationId(
    @Param('conversationId') conversationId: string,
    @Req() request: Request,
  ) {
    const user = request.user as RequestUser;
    return this.conversationsService
      .getAuthorized(conversationId, user)
      .then(() => this.messagesService.findByConversationId(conversationId));
  }

  @Post()
  create(
    @Body() createMessageDto: CreateMessageDto,
    @Req() request: Request,
  ) {
    const user = request.user as RequestUser;
    const conversationId = createMessageDto.conversationId;
    if (!conversationId) {
      throw new ForbiddenException('Conversation is required');
    }

    return this.conversationsService
      .getAuthorized(conversationId, user)
      .then(() =>
        this.messagesService.create({
          ...createMessageDto,
          conversationId,
          senderId: user.id,
          senderType: this.resolveSenderType(user.role),
        }),
      );
  }

  private resolveSenderType(role: UserRole) {
    if (role === UserRole.Landlord) {
      return MessageSender.Owner;
    }
    if (role === UserRole.Admin || role === UserRole.Manager) {
      return MessageSender.Assistant;
    }
    return MessageSender.Tenant;
  }
}

