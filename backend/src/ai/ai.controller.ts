import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/request.types';
import { RegenerateDto } from './dto/regenerate.dto';
import { TranslateDto } from './dto/translate.dto';
import { QADto } from './dto/qa.dto';
import { PitchDto } from './dto/pitch.dto';
import { PitchSendDto } from './dto/pitch-send.dto';
import { NotificationsService } from '../notifications/notifications.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * POST /ai/property/:id/title
   * Generate an AI title for a property the authenticated user owns.
   */
  @Post('property/:id/title')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate AI title for a property' })
  @ApiParam({ name: 'id', description: 'Property ID (cuid)' })
  generateTitle(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.generateTitle(user.sub, id);
  }

  /**
   * POST /ai/property/:id/description
   * Generate a 200-400 word description for a property the user owns.
   */
  @Post('property/:id/description')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate AI description for a property' })
  @ApiParam({ name: 'id', description: 'Property ID (cuid)' })
  generateDescription(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.generateDescription(user.sub, id);
  }

  /**
   * POST /ai/property/:id/regenerate
   * Regenerate selected AI fields (title and/or description).
   */
  @Post('property/:id/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate selected AI fields for a property' })
  @ApiParam({ name: 'id', description: 'Property ID (cuid)' })
  @ApiBody({ type: RegenerateDto })
  regenerate(
    @Param('id') id: string,
    @Body() dto: RegenerateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.regenerate(user.sub, id, dto);
  }

  /**
   * POST /ai/translate
   * Translate text to a supported Indian language.
   */
  @Post('translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Translate text to a supported Indian language' })
  @ApiBody({ type: TranslateDto })
  translate(
    @Body() dto: TranslateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.translate(user.sub, dto);
  }

  /**
   * POST /ai/qa
   * Answer a buyer's question about a property (RAG-lite).
   */
  @Post('qa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Answer a buyer question about a property" })
  @ApiBody({ type: QADto })
  qa(
    @Body() dto: QADto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.qa(user.sub, dto);
  }

  /**
   * POST /ai/pitch
   * Generate a short WhatsApp-ready pitch paragraph.
   */
  @Post('pitch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a short audience-tailored pitch for a property' })
  @ApiBody({ type: PitchDto })
  pitch(
    @Body() dto: PitchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.pitch(user.sub, dto);
  }

  /**
   * POST /ai/pitch/send
   * Generate a short WhatsApp-ready pitch paragraph AND send it via WhatsApp.
   */
  @Post('pitch/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a pitch and send it via WhatsApp' })
  @ApiBody({ type: PitchSendDto })
  async pitchAndSend(
    @Body() dto: PitchSendDto,
    @CurrentUser() user: AuthenticatedUser & { whatsappNumber?: string },
  ) {
    const { pitch } = await this.aiService.pitch(user.sub, dto);

    // Resolve target phone: explicit > user profile
    const phone = dto.phone ?? user.whatsappNumber;
    const sendResult = phone
      ? await this.notifications.sendWhatsApp({ to: phone, body: pitch }).catch((err: unknown) => {
          return { skipped: true, error: err instanceof Error ? err.message : String(err) };
        })
      : { skipped: true, error: 'No phone number available' };

    return { pitch, sent: !sendResult.skipped, result: sendResult };
  }
}
