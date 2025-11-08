import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { ListNotificationsDto } from './dto/list-notifications.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Query() query: ListNotificationsDto, @Req() req: Request) {
    const user = req.user as User;
    const userId = query.userId ?? user.id;
    this.ensureOwnership(user, userId);

    const notifications = await this.notificationsService.findByUser({
      userId,
      type: query.type,
      isRead: query.isRead,
      limit: query.limit,
    });

    return {
      success: true,
      data: notifications,
    };
  }

  @Get('unread-count')
  async unreadCount(
    @Query() query: ListNotificationsDto,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    const userId = query.userId ?? user.id;
    this.ensureOwnership(user, userId);
    const count = await this.notificationsService.countUnread(userId);
    return {
      success: true,
      data: { count },
    };
  }

  @Roles(UserRole.Admin)
  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    const notification =
      await this.notificationsService.create(createNotificationDto);
    return {
      success: true,
      message: 'Notification created',
      data: notification,
    };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    const notification = await this.notificationsService.markAsRead(
      id,
      user.role === UserRole.Admin ? undefined : user.id,
    );
    return {
      success: true,
      data: notification,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    await this.notificationsService.remove(
      id,
      user.role === UserRole.Admin ? undefined : user.id,
    );
    return {
      success: true,
      message: 'Notification removed',
    };
  }

  private ensureOwnership(user: User, targetUserId: number) {
    if (!user) {
      throw new ForbiddenException('Access denied');
    }
    if (user.role === UserRole.Admin) {
      return;
    }
    if (user.id !== targetUserId) {
      throw new ForbiddenException(
        'You can only access your notifications',
      );
    }
  }
}

