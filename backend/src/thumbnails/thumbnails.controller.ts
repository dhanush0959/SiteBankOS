import { Controller, Get, Delete, Post, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ThumbnailsService } from './thumbnails.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/request.types';
import { BannerRequestDto } from './dto/banner-request.dto';

@ApiTags('thumbnails')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('thumbnails')
export class ThumbnailsController {
  constructor(private readonly thumbnails: ThumbnailsService) {}

  @Get('templates')
  @ApiOperation({ summary: 'List available banner templates' })
  getTemplates() {
    return this.thumbnails.getBannerTemplates();
  }

  @Post(['properties/:propertyId/banner', 'properties/:propertyId/poster'])
  @ApiOperation({ summary: 'Generate a branded marketing banner' })
  @ApiResponse({ status: 201, description: 'Banner generated' })
  generateBanner(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: BannerRequestDto,
  ) {
    return this.thumbnails.generateBanner(user.sub, propertyId, dto);
  }

  @Post('properties/:propertyId/suggest-headlines')
  @ApiOperation({ summary: 'Suggest AI headlines for property marketing' })
  suggestHeadlines(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.thumbnails.suggestHeadlines(user.sub, propertyId);
  }

  @Get('properties/:propertyId')
  @ApiOperation({ summary: 'List thumbnails for a property (owner only)' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.thumbnails.listForProperty(user.sub, propertyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a thumbnail asset' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.thumbnails.remove(user.sub, id);
  }

  @Post('properties/:propertyId/generate')
  @ApiOperation({ summary: 'Generate a thumbnail from the property cover photo' })
  @ApiResponse({ status: 201, description: 'Thumbnail generated' })
  @ApiResponse({ status: 400, description: 'No photos available' })
  @ApiResponse({ status: 403, description: 'Not the property owner' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.thumbnails.generate(user.sub, propertyId);
  }
}
