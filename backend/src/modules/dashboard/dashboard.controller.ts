import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@CurrentUser('userId') userId: string) {
    return this.dashboardService.getAggregatedDashboard(userId);
  }

  @Get('expenses-by-category')
  async getExpensesByCategory(
    @CurrentUser('userId') userId: string,
    @Query('month') month?: string,
  ) {
    return this.dashboardService.getExpensesByCategory(userId, month);
  }

  @Get('historical-trend')
  async getHistoricalTrend(
    @CurrentUser('userId') userId: string,
    @Query('months') months?: string,
  ) {
    const monthsCount = months ? parseInt(months, 10) : 6;
    return this.dashboardService.getHistoricalTrend(userId, monthsCount);
  }

  @Get('upcoming-dues')
  async getUpcomingDues(@CurrentUser('userId') userId: string) {
    return this.dashboardService.getUpcomingDues(userId);
  }
}
