import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { StatsService } from '../stats/stats.service';
import { UsersService } from '../users/users.service';
import { ListUsersDto } from '../users/dto/list-users.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly statsService: StatsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('traffic-stats')
  async getTrafficStats() {
    const data = await this.statsService.getTrafficStats();
    return { success: true, data };
  }

  @Get('users')
  async getUsers(@Query() query: ListUsersDto) {
    const data = await this.usersService.findAllWithPagination({
      ...query,
      limit: query.limit ?? 20,
      page: query.page ?? 1,
    });
    return { success: true, data };
  }

  @Patch('users/:id/disable')
  async disableUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.disableUser(id);
    return {
      success: true,
      message: 'User disabled successfully',
      data: user,
    };
  }

  @Patch('users/:id/enable')
  async enableUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.enableUser(id);
    return {
      success: true,
      message: 'User enabled successfully',
      data: user,
    };
  }
}
