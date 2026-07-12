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
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { PropertyStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { ReorderMediaDto } from './dto/reorder-media.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import type { AuthenticatedUser } from '../common/types/request.types';

export class ChangeStatusDto {
  @ApiProperty({ enum: PropertyStatus })
  @IsEnum(PropertyStatus)
  status!: PropertyStatus;
}

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // ---------------------------------------------------------------------------
  // POST /properties — create
  // ---------------------------------------------------------------------------
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new property with optional initial media' })
  @ApiCreatedResponse({ description: 'Property created' })
  create(
    @CurrentUser() user: AuthenticatedUser, 
    @Body() dto: CreatePropertyDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Note: When using multipart/form-data, nested objects like location and specs
    // might be received as strings depending on the client. Class-validator/transformer
    // usually handle this if @Type() is used, but some clients might need manual JSON.parse.
    return this.propertiesService.create(user.sub, dto, files);
  }

  // ---------------------------------------------------------------------------
  // POST /properties/bulk-upload
  // ---------------------------------------------------------------------------
  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Bulk upload properties via Excel/CSV' })
  @ApiCreatedResponse({ description: 'Bulk upload processing results' })
  bulkUpload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.propertiesService.bulkUpload(user.sub, file);
  }

  // ---------------------------------------------------------------------------
  // GET /properties — list
  // ---------------------------------------------------------------------------
  @Get()
  @ApiOperation({ summary: "List current user's properties with filters and pagination" })
  @ApiOkResponse({ description: 'Paginated list of properties' })
  findMany(@CurrentUser() user: AuthenticatedUser, @Query() query: ListPropertiesQueryDto) {
    return this.propertiesService.findManyForUser(user.sub, query);
  }

  // ---------------------------------------------------------------------------
  // GET /properties/:id — get one
  // ---------------------------------------------------------------------------
  @Get('cities')
  @ApiOperation({ summary: 'List all unique cities from existing properties' })
  getCities(@CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.getUniqueCities(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single property (owner or agency member)' })
  @ApiOkResponse({ description: 'Property detail' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseCuidPipe) id: string,
  ) {
    return this.propertiesService.findById(user.sub, id, user.agencyId);
  }

  // ---------------------------------------------------------------------------
  // PATCH /properties/:id — update
  // ---------------------------------------------------------------------------
  @Patch(':id')
  @ApiOperation({ summary: 'Update a property (owner only)' })
  @ApiOkResponse({ description: 'Updated property' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(user.sub, id, dto);
  }

  // ---------------------------------------------------------------------------
  // DELETE /properties/:id — archive (soft delete)
  // ---------------------------------------------------------------------------
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a property (soft delete, owner only)' })
  @ApiNoContentResponse({ description: 'Property archived' })
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseCuidPipe) id: string,
  ) {
    return this.propertiesService.archive(user.sub, id);
  }

  // ---------------------------------------------------------------------------
  // POST /properties/:id/media — upload media
  // ---------------------------------------------------------------------------
  @Post(':id/media')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload images for a property (max 10, each ≤10 MB)' })
  @ApiCreatedResponse({ description: 'Updated property with media' })
  addMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseCuidPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.propertiesService.addMedia(user.sub, id, files);
  }

  // ---------------------------------------------------------------------------
  // DELETE /properties/:id/media/:mediaId
  // ---------------------------------------------------------------------------
  @Delete(':id/media/:mediaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a media item (owner only)' })
  @ApiNoContentResponse({ description: 'Media removed' })
  removeMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseCuidPipe) id: string,
    @Param('mediaId', ParseCuidPipe) mediaId: string,
  ) {
    return this.propertiesService.removeMedia(user.sub, id, mediaId);
  }

  // ---------------------------------------------------------------------------
  // PATCH /properties/:id/media/reorder
  // ---------------------------------------------------------------------------
  @Patch(':id/media/reorder')
  @ApiOperation({ summary: 'Reorder media items (owner only)' })
  @ApiOkResponse({ description: 'Reordered media list' })
  reorderMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: ReorderMediaDto,
  ) {
    return this.propertiesService.reorderMedia(user.sub, id, dto);
  }

  // ---------------------------------------------------------------------------
  // PATCH /properties/:id/media/:mediaId/cover
  // ---------------------------------------------------------------------------
  @Patch(':id/media/:mediaId/cover')
  @ApiOperation({ summary: 'Set a media item as the cover (owner only)' })
  @ApiOkResponse({ description: 'Updated media list with new cover' })
  setCover(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseCuidPipe) id: string,
    @Param('mediaId', ParseCuidPipe) mediaId: string,
  ) {
    return this.propertiesService.setCover(user.sub, id, mediaId);
  }

  // ---------------------------------------------------------------------------
  // POST /properties/:id/submit-for-verification
  // ---------------------------------------------------------------------------
  @Post(':id/submit-for-verification')
  @ApiOperation({ summary: 'Submit property for verification (owner only)' })
  @ApiOkResponse({ description: 'Property submitted for verification' })
  submitForVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseCuidPipe) id: string,
  ) {
    return this.propertiesService.submitForVerification(user.sub, id);
  }

  // ---------------------------------------------------------------------------
  // POST /properties/:id/status
  // ---------------------------------------------------------------------------
  @Post(':id/status')
  @ApiOperation({ summary: 'Change property status (owner only)' })
  @ApiOkResponse({ description: 'Updated property' })
  changeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.propertiesService.changeStatus(user.sub, id, dto.status);
  }
}
