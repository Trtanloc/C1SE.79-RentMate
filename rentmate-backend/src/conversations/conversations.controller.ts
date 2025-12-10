import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async list(@Req() req: Request) {
    const user = req.user as User;
    const data = await this.conversationsService.listForUser(user);
    return { success: true, data };
  }

  @Post()
  async create(
    @Body() dto: CreateConversationDto,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    const data = await this.conversationsService.findOrCreate(user.id, dto);
    return {
      success: true,
      message: 'Conversation ready',
      data,
    };
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    const data = await this.conversationsService.getAuthorized(id, user);
    return { success: true, data };
  }
}
