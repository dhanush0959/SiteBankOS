import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RangeQueryDto, LiveQueryDto } from './dto/range.query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/request.types';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ---------------------------------------------------------------------------
  // GET /analytics/dashboard?range=7d|30d|90d
  // ---------------------------------------------------------------------------
  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics for the current user' })
  @ApiOkResponse({ description: 'Aggregated dashboard metrics for current user' })
  getDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RangeQueryDto,
  ) {
    return this.analyticsService.getDashboard(user.sub, query.range ?? '30d');
  }

  @Get('agency')
  @ApiOperation({ summary: 'Get dashboard analytics for the current agency' })
  @ApiOkResponse({ description: 'Aggregated dashboard metrics for current agency' })
  getAgencyDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RangeQueryDto,
  ) {
    return this.analyticsService.getAgencyDashboard(user.sub, query.range ?? '30d');
  }

  // ---------------------------------------------------------------------------
  // GET /analytics/live?propertyId=&minutes=15
  // ---------------------------------------------------------------------------
  @Get('live')
  @ApiOperation({ summary: 'Get live event count for the last N minutes' })
  @ApiOkResponse({ description: 'Count of events in the specified time window' })
  getLive(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: LiveQueryDto,
  ) {
    return this.analyticsService.getLiveCount(
      user.sub,
      query.propertyId,
      query.minutes ?? 15,
    );
  }

  // ---------------------------------------------------------------------------
  // GET /analytics/properties/:propertyId?range=...
  // ---------------------------------------------------------------------------
  @Get('properties/:propertyId')
  @ApiOperation({ summary: 'Get analytics for a specific property (owner only)' })
  @ApiOkResponse({ description: 'Property-level analytics breakdown' })
  getPropertyAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
    @Query() query: RangeQueryDto,
  ) {
    return this.analyticsService.getPropertyAnalytics(
      user.sub,
      propertyId,
      query.range ?? '30d',
    );
  }

  // ---------------------------------------------------------------------------
  // GET /analytics/smart-links/:smartLinkId?range=...
  // ---------------------------------------------------------------------------
  @Get('smart-links/:smartLinkId')
  @ApiOperation({ summary: 'Get analytics for a specific smart link (owner only)' })
  @ApiOkResponse({ description: 'Smart-link-level analytics breakdown' })
  getSmartLinkAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('smartLinkId') smartLinkId: string,
    @Query() query: RangeQueryDto,
  ) {
    return this.analyticsService.getSmartLinkAnalytics(
      user.sub,
      smartLinkId,
      query.range ?? '30d',
    );
  }
}
