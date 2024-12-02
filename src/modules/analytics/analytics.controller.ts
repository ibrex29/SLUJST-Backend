import { Controller, Get, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service'; // Adjust the import based on your file structure
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';


@ApiBearerAuth()
@ApiTags('analytics')
@Controller({ path: 'analytics', version: '1' }) 
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('reviewer/manuscripts-count')
  async getCountsForReviewer(@Request() req) {
    const userId = req.user.id;
    return this.analyticsService.getManuscriptsAnalyticsForLoggedInUser(userId);
  }

  @Get('section/manuscripts-count')
  async getCountsForEditor(@Request() req) {
    const userId = req.user.id;
    return this.analyticsService.getManuscriptsAnalyticsForLoggedInEditor(userId);
  }

  @Get('general')
  async getGeneralAnalysis() {
    const analysis = await this.analyticsService.getGeneralAnalysis();
    return analysis;
  }
}
