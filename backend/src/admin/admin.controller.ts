import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/request.types';
import {
  AdminUsersQueryDto,
  AdminAgenciesQueryDto,
  AdminPropertiesQueryDto,
} from './dto/admin-query.dto';
import { SetRoleDto } from './dto/set-role.dto';
import { RejectPropertyDto } from './dto/reject-property.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Platform stats ──────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide stats' })
  getStats() {
    return this.adminService.getStats();
  }

  // ── User management ─────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'Search users' })
  searchUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.searchUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail with subscription and counts' })
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user' })
  suspendUser(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.adminService.suspendUser(id, user.sub);
  }

  @Post('users/:id/activate')
  @ApiOperation({ summary: 'Activate a user' })
  activateUser(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.adminService.activateUser(id, user.sub);
  }

  @Post('users/:id/role')
  @ApiOperation({ summary: "Set a user's role" })
  setUserRole(
    @Param('id') id: string,
    @Body() dto: SetRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.setUserRole(id, dto.role, user.sub);
  }

  // ── Agency management ───────────────────────────────────────────────────────

  @Get('agencies')
  @ApiOperation({ summary: 'Search agencies' })
  searchAgencies(@Query() query: AdminAgenciesQueryDto) {
    return this.adminService.searchAgencies(query);
  }

  @Post('agencies/:id/suspend')
  @ApiOperation({ summary: 'Suspend an agency' })
  suspendAgency(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.adminService.suspendAgency(id, user.sub);
  }

  @Post('agencies/:id/activate')
  @ApiOperation({ summary: 'Activate an agency' })
  activateAgency(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.adminService.activateAgency(id, user.sub);
  }

  // ── Property management ─────────────────────────────────────────────────────

  @Get('properties')
  @ApiOperation({ summary: 'Search properties' })
  searchProperties(@Query() query: AdminPropertiesQueryDto) {
    return this.adminService.searchProperties(query);
  }

  @Post('properties/:id/verify')
  @ApiOperation({ summary: 'Verify a property' })
  verifyProperty(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.adminService.verifyProperty(id, user.sub);
  }

  @Post('properties/:id/reject')
  @ApiOperation({ summary: 'Reject a property with reason' })
  rejectProperty(
    @Param('id') id: string,
    @Body() dto: RejectPropertyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.rejectProperty(id, user.sub, dto.reason);
  }
}
