import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { StatsService } from './stats.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get('overview')
  async getOverview(@Req() req: Request) {
    const data = await this.statsService.getOverview(req.user as any);
    return {
      success: true,
      data,
    };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('categories')
  async getCategories(@Req() req: Request) {
    const data = await this.statsService.getCategoryHighlights(
      req.user as any,
    );
    return {
      success: true,
      data,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    const data = await this.statsService.getDashboard(req.user as any);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Get('admin-charts')
  async getAdminCharts() {
    const data = await this.statsService.getAdminCharts();
    return { success: true, data };
  }
}
