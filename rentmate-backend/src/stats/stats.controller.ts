import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  async getOverview() {
    const data = await this.statsService.getOverview();
    return {
      success: true,
      data,
    };
  }

  @Get('categories')
  async getCategories() {
    const data = await this.statsService.getCategoryHighlights();
    return {
      success: true,
      data,
    };
  }

  @Get('dashboard')
  async getDashboard() {
    const data = await this.statsService.getDashboard();
    return { success: true, data };
  }

  @Get('admin-charts')
  async getAdminCharts() {
    const data = await this.statsService.getAdminCharts();
    return { success: true, data };
  }
}
