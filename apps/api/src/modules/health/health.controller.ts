import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** Returns service health status and database connectivity */
  @Get()
  @ApiOperation({ summary: 'Check API health' })
  check() {
    return this.healthService.check();
  }
}
