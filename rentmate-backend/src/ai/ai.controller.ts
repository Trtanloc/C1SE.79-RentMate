import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../common/enums/user-role.enum';

type RequestUser = {
  id: number;
  role: UserRole;
  fullName?: string;
};

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  handleChat(
    @Body() chatRequestDto: ChatRequestDto,
    @Req() request: Request,
  ) {
    const user = request.user as RequestUser | undefined;
    if (!user || user.role !== UserRole.Tenant) {
      throw new ForbiddenException(
        'Only tenants can chat with the AI assistant.',
      );
    }

    return this.aiService.handleChat(user, chatRequestDto);
  }
}

