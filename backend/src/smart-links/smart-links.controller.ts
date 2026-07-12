import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { SmartLinksService } from './smart-links.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/request.types';
import { CreateSmartLinkDto } from './dto/create-smart-link.dto';
import { UpdateSmartLinkDto } from './dto/update-smart-link.dto';
import { TrackEventDto } from './dto/track-event.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { PublicChatDto } from './dto/public-chat.dto';
import { SmartLinkStatus } from '@prisma/client';

@ApiTags('Smart Links')
@Controller('smart-links')
@UseGuards(JwtAuthGuard)
export class SmartLinksController {
  constructor(private readonly smartLinksService: SmartLinksService) {}

  // ─── Authenticated endpoints ──────────────────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new smart link for a property you own' })
  @ApiResponse({ status: 201, description: 'Smart link created' })
  @ApiResponse({ status: 403, description: 'Not the property owner' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSmartLinkDto) {
    return this.smartLinksService.create(user.sub, dto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List smart links for the current user' })
  @ApiQuery({ name: 'propertyId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: SmartLinkStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: SmartLinkStatus,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.smartLinksService.findAll(user.sub, {
      propertyId,
      status,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one smart link with its recent events' })
  @ApiParam({ name: 'id', description: 'SmartLink ID' })
  @ApiResponse({ status: 200, description: 'Smart link details' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.smartLinksService.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a smart link status, expiry, or password' })
  @ApiParam({ name: 'id', description: 'SmartLink ID' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSmartLinkDto,
  ) {
    return this.smartLinksService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a smart link and all its events' })
  @ApiParam({ name: 'id', description: 'SmartLink ID' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.smartLinksService.remove(user.sub, id);
  }

  @Post(':id/regenerate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rotate the slug for a smart link' })
  @ApiParam({ name: 'id', description: 'SmartLink ID' })
  regenerate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.smartLinksService.regenerateSlug(user.sub, id);
  }

  // ─── Public endpoints ─────────────────────────────────────────────────────

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { ttl: 60_000, limit: 5 } })
  @Post(':slug/verify-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a smart link password' })
  @ApiParam({ name: 'slug', description: 'Smart link slug' })
  @ApiResponse({ status: 200, description: '{ ok: true|false }' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  verifyPassword(@Param('slug') slug: string, @Body() dto: VerifyPasswordDto) {
    return this.smartLinksService.verifyPassword(slug, dto.password);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { ttl: 60_000, limit: 30 } })
  @Get(':slug/public')
  @ApiOperation({ summary: 'Get public property microsite data for a smart link' })
  @ApiParam({ name: 'slug', description: 'Smart link slug' })
  @ApiHeader({ name: 'X-Smart-Link-Password', required: false, description: 'Password for protected links' })
  @ApiResponse({ status: 200, description: 'Public property data' })
  @ApiResponse({ status: 401, description: 'Password required or invalid' })
  @ApiResponse({ status: 404, description: 'Slug not found' })
  @ApiResponse({ status: 410, description: 'Link expired or disabled' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getPublic(
    @Param('slug') slug: string,
    @Headers('x-smart-link-password') headerPassword?: string,
    @Query('pw') queryPassword?: string,
    @Req() _req?: Request,
  ) {
    const submittedPassword = headerPassword ?? queryPassword;
    return this.smartLinksService.getPublic(slug, submittedPassword);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { ttl: 60_000, limit: 60 } })
  @Post(':slug/events')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track an event for a smart link' })
  @ApiParam({ name: 'slug', description: 'Smart link slug' })
  @ApiResponse({ status: 204, description: 'Event recorded' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async trackEvent(
    @Param('slug') slug: string,
    @Body() dto: TrackEventDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
      ?? req.ip
      ?? '0.0.0.0';
    const userAgent = req.headers['user-agent'] ?? '';
    await this.smartLinksService.trackEvent(slug, dto, ip, userAgent);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { ttl: 60_000, limit: 30 } })
  @Post(':slug/chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat with the AI assistant for a specific property' })
  @ApiParam({ name: 'slug', description: 'Smart link slug' })
  @ApiResponse({ status: 200, description: 'The assistant response' })
  @ApiResponse({ status: 404, description: 'Slug not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async chat(
    @Param('slug') slug: string,
    @Body() dto: PublicChatDto,
  ) {
    return this.smartLinksService.chat(slug, dto);
  }
}

