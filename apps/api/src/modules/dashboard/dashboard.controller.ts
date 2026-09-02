import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** Returns key aggregate metrics for the live operations dashboard */
  @Get('metrics')
  @ApiOperation({ summary: 'Get real-time dashboard metrics' })
  getMetrics() {
    return this.dashboardService.getMetrics();
  }
}
