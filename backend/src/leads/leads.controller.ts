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
  UseInterceptors,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/request.types';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';
import { Idempotent } from '../common/decorators/idempotent.decorator';
import { createHash } from 'crypto';

// ── Public endpoint (no auth) ─────────────────────────────────────────────────
@ApiTags('public')
@Controller('leads')
export class LeadsPublicController {
  constructor(private readonly leadsService: LeadsService) {}

  @Public()
  @Post('public')
  @ApiOperation({ summary: 'Capture lead from a smart-link page form' })
  @ApiCreatedResponse({ description: 'Lead captured successfully' })
  async capturePublicLead(@Req() req: any, @Body() dto: CreatePublicLeadDto) {
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    if (!idempotencyKey) {
      throw new BadRequestException('x-idempotency-key header is required');
    }
    
    const protocolVersion = (req.headers['x-protocol-version'] as string) || 'v1';
    const payloadHash = createHash('sha256').update(JSON.stringify(dto || {})).digest('hex');

    return this.leadsService.capturePublicLead(dto, {
      idempotencyKey,
      protocolVersion,
      payloadHash,
      path: req.url,
    });
  }
}

// ── Authenticated endpoints ────────────────────────────────────────────────────
@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // GET /leads/stats — must come before :id to avoid route collision
  @Get('stats')
  @ApiOperation({ summary: 'Get lead counts grouped by status for the current agent' })
  @ApiOkResponse({ description: 'Stats object keyed by LeadStatus + total' })
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.getStats(user.sub);
  }

  // PATCH /leads/reminders/:reminderId — must come before :id/reminders
  @Patch('reminders/:reminderId')
  @ApiOperation({ summary: 'Update a follow-up reminder (status or remindAt)' })
  updateReminder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reminderId') reminderId: string,
    @Body() dto: UpdateReminderDto,
  ) {
    return this.leadsService.updateReminder(reminderId, user.sub, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a lead manually (walk-in agent input)' })
  @ApiCreatedResponse({ description: 'Lead created' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List current agent leads with filters and pagination' })
  @ApiOkResponse({ description: 'Paginated lead list' })
  findMany(@CurrentUser() user: AuthenticatedUser, @Query() query: ListLeadsQueryDto) {
    return this.leadsService.findManyForAgent(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one lead (agent must be owner)' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leadsService.findById(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead details or status' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a lead' })
  @ApiNoContentResponse({ description: 'Lead deleted' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leadsService.remove(id, user.sub);
  }

  @Post(':id/reminders')
  @ApiOperation({ summary: 'Create a follow-up reminder for a lead' })
  @ApiCreatedResponse({ description: 'Reminder created' })
  createReminder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateReminderDto,
  ) {
    return this.leadsService.createReminder(id, user.sub, dto);
  }

  @Get(':id/reminders')
  @ApiOperation({ summary: 'List all reminders for a lead' })
  listReminders(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leadsService.listRemindersForLead(id, user.sub);
  }
}
