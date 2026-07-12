import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/request.types';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'AGENCY_ADMIN')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit logs (SUPER_ADMIN: all; AGENCY_ADMIN: own agency only)' })
  query(@Query() filters: AuditQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const scope = user.role === 'SUPER_ADMIN' ? {} : { agencyId: user.agencyId };
    return this.auditService.query(filters, scope);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit log entry' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const scope = user.role === 'SUPER_ADMIN' ? {} : { agencyId: user.agencyId };
    return this.auditService.findById(id, scope);
  }
}
