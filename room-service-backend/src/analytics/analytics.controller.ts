import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'MANAGER')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /api/analytics/monthly?year=2026&month=4
   * Returns operational analytics for a specific month.
   */
  @Get('monthly')
  getMonthly(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const now = new Date();
    const y = year ? Number.parseInt(year, 10) : now.getFullYear();
    const m = month ? Number.parseInt(month, 10) : now.getMonth() + 1;
    return this.analyticsService.getMonthlyAnalytics(y, m);
  }

  /**
   * GET /api/analytics/trends?months=6
   * Returns analytics for the last N months (default 6).
   */
  @Get('trends')
  getTrends(@Query('months') months: string) {
    const n = months ? Number.parseInt(months, 10) : 6;
    return this.analyticsService.getTrendAnalytics(n);
  }
}
