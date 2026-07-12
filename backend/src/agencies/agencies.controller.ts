import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AgenciesService } from './agencies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/request.types';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

@ApiTags('agencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agency (current user becomes owner)' })
  createAgency(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAgencyDto,
  ) {
    return this.agenciesService.createForOwner(user.sub, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my agency' })
  getMyAgency(@CurrentUser() user: AuthenticatedUser) {
    return this.agenciesService.getMyAgency(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency by ID (members only)' })
  getAgency(@Param('id') id: string) {
    return this.agenciesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agency (owner only)' })
  updateAgency(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAgencyDto,
  ) {
    return this.agenciesService.updateAgency(id, user.sub, dto);
  }

  @Post(':id/branding')
  @ApiOperation({ summary: 'Update agency branding settings (owner only)' })
  updateBranding(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: Record<string, unknown>,
  ) {
    return this.agenciesService.updateBranding(id, user.sub, data);
  }

  @Post(':id/members/invite')
  @ApiOperation({ summary: 'Invite a member to the agency (owner only)' })
  inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteMemberDto,
  ) {
    return this.agenciesService.inviteMember(id, user.sub, dto.email, dto.role);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from the agency (owner only)' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agenciesService.removeMember(id, user.sub, userId);
  }

  @Post(':id/logo')
  @ApiOperation({ summary: 'Upload agency logo (owner only)' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  uploadLogo(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.agenciesService.uploadLogo(id, user.sub, file);
  }
}
