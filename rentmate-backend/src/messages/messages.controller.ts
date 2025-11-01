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

type RequestUser = {
  id: number;
  role: UserRole;
  fullName?: string;
};

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':conversationId')
  findByConversationId(
    @Param('conversationId') conversationId: string,
    @Req() request: Request,
  ) {
    const tenant = this.assertTenant(request.user as RequestUser | undefined);
    const expectedConversationId = this.getTenantConversationId(tenant);
    this.ensureConversationAccess(conversationId, expectedConversationId);
    return this.messagesService.findByConversationId(conversationId);
  }

  @Post()
  create(
    @Body() createMessageDto: CreateMessageDto,
    @Req() request: Request,
  ) {
    const tenant = this.assertTenant(request.user as RequestUser | undefined);
    const expectedConversationId = this.getTenantConversationId(tenant);
    const conversationId =
      createMessageDto.conversationId ?? expectedConversationId;
    this.ensureConversationAccess(conversationId, expectedConversationId);

    return this.messagesService.create({
      ...createMessageDto,
      conversationId,
      senderId: tenant.id,
      senderType: MessageSender.Tenant,
    });
  }

  private ensureConversationAccess(
    conversationId: string,
    expectedConversationId: string,
  ) {
    if (conversationId !== expectedConversationId) {
      throw new ForbiddenException('You cannot access this conversation.');
    }
  }

  private getTenantConversationId(user: RequestUser) {
    return `tenant-${user.id}`;
  }

  private assertTenant(user: RequestUser | undefined): RequestUser {
    if (!user || user.role !== UserRole.Tenant) {
      throw new ForbiddenException('Only tenants can access this chat history.');
    }
    return user;
  }
}

