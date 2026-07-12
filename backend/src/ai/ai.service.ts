import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  buildTitleSystemPrompt,
  buildTitleUserPrompt,
  buildDescriptionSystemPrompt,
  buildDescriptionUserPrompt,
  buildTranslateSystemPrompt,
  buildQASystemPrompt,
  buildQAUserPrompt,
  buildPitchSystemPrompt,
  buildPitchUserPrompt,
  buildThumbnailCopySystemPrompt,
  buildThumbnailCopyUserPrompt,
  type PropertyContext,
} from './prompts';
import type { RegenerateDto } from './dto/regenerate.dto';
import type { TranslateDto } from './dto/translate.dto';
import type { QADto } from './dto/qa.dto';
import type { PitchDto } from './dto/pitch.dto';

type PlanFeatures = {
  aiTitle?: boolean;
  aiDescription?: boolean;
  aiPitch?: boolean;
  aiQA?: boolean;
  [key: string]: unknown;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openaiClient: OpenAI | null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) {
      this.logger.warn('DEEPSEEK_API_KEY is not configured. AI features will be unavailable.');
      this.openaiClient = null;
    } else {
      const baseURL =
        this.config.get<string>('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com';
      this.openaiClient = new OpenAI({
        apiKey,
        baseURL,
        timeout: 30_000,
        maxRetries: 1,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Generate title
  // ---------------------------------------------------------------------------
  async generateTitle(userId: string, propertyId: string): Promise<{ title: string }> {
    this.assertConfigured();
    await this.assertPlanFeature(userId, 'aiTitle');
    const property = await this.assertOwnerAndLoad(userId, propertyId);

    const ctx = this.buildContext(property);
    const title = await this.chatComplete(
      buildTitleSystemPrompt(),
      buildTitleUserPrompt(ctx),
      { temperature: 0.7, max_tokens: 120 },
    );

    await this.prisma.property.update({
      where: { id: propertyId },
      data: { aiGeneratedTitle: title },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'ai_generate_title',
      entityType: 'Property',
      entityId: propertyId,
    });

    return { title };
  }

  // ---------------------------------------------------------------------------
  // Generate description
  // ---------------------------------------------------------------------------
  async generateDescription(
    userId: string,
    propertyId: string,
  ): Promise<{ description: string }> {
    this.assertConfigured();
    await this.assertPlanFeature(userId, 'aiDescription');
    const property = await this.assertOwnerAndLoad(userId, propertyId);

    const ctx = this.buildContext(property);
    const description = await this.chatComplete(
      buildDescriptionSystemPrompt(),
      buildDescriptionUserPrompt(ctx),
      { temperature: 0.7, max_tokens: 600 },
    );

    await this.prisma.property.update({
      where: { id: propertyId },
      data: { aiGeneratedDescription: description },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'ai_generate_description',
      entityType: 'Property',
      entityId: propertyId,
    });

    return { description };
  }

  // ---------------------------------------------------------------------------
  // Regenerate selected fields
  // ---------------------------------------------------------------------------
  async regenerate(
    userId: string,
    propertyId: string,
    dto: RegenerateDto,
  ): Promise<{ title?: string; description?: string }> {
    this.assertConfigured();
    const result: { title?: string; description?: string } = {};

    for (const field of dto.fields) {
      if (field === 'title') {
        const res = await this.generateTitle(userId, propertyId);
        result.title = res.title;
      } else if (field === 'description') {
        const res = await this.generateDescription(userId, propertyId);
        result.description = res.description;
      }
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Translate
  // ---------------------------------------------------------------------------
  async translate(userId: string, dto: TranslateDto): Promise<{ translated: string }> {
    this.assertConfigured();

    const translated = await this.chatComplete(
      buildTranslateSystemPrompt(dto.targetLang),
      dto.text,
      { temperature: 0.3, max_tokens: 600 },
    );

    await this.audit.log({
      actorUserId: userId,
      action: 'ai_translate',
      entityType: 'User',
      entityId: userId,
      metadata: { targetLang: dto.targetLang, charCount: dto.text.length },
    });

    return { translated };
  }

  // ---------------------------------------------------------------------------
  // Q&A
  // ---------------------------------------------------------------------------
  async qa(userId: string, dto: QADto): Promise<{ answer: string }> {
    this.assertConfigured();
    await this.assertPlanFeature(userId, 'aiQA');

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    const ctx = this.buildContext(property);
    const answer = await this.chatComplete(
      buildQASystemPrompt(),
      buildQAUserPrompt(ctx, dto.question),
      { temperature: 0.3, max_tokens: 300 },
    );

    await this.audit.log({
      actorUserId: userId,
      action: 'ai_qa',
      entityType: 'Property',
      entityId: dto.propertyId,
    });

    return { answer };
  }

  // ---------------------------------------------------------------------------
  // Pitch
  // ---------------------------------------------------------------------------
  async pitch(userId: string, dto: PitchDto): Promise<{ pitch: string }> {
    this.assertConfigured();
    await this.assertPlanFeature(userId, 'aiPitch');

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    const ctx = this.buildContext(property);
    const pitchText = await this.chatComplete(
      buildPitchSystemPrompt(dto.audience, dto.tone),
      buildPitchUserPrompt(ctx),
      { temperature: 0.7, max_tokens: 300 },
    );

    await this.audit.log({
      actorUserId: userId,
      action: 'ai_pitch',
      entityType: 'Property',
      entityId: dto.propertyId,
      metadata: { audience: dto.audience, tone: dto.tone },
    });

    return { pitch: pitchText };
  }

  // ---------------------------------------------------------------------------
  // Thumbnail Copy
  // ---------------------------------------------------------------------------
  async generateThumbnailCopy(
    userId: string,
    propertyId: string,
  ): Promise<{ headline: string; highlight: string }> {
    this.assertConfigured();
    const property = await this.assertOwnerAndLoad(userId, propertyId);

    const ctx = this.buildContext(property);
    const jsonStr = await this.chatComplete(
      buildThumbnailCopySystemPrompt(),
      buildThumbnailCopyUserPrompt(ctx),
      { temperature: 0.7, max_tokens: 150 },
    );

    try {
      // DeepSeek often returns JSON within triple backticks or as plain text
      const cleanJson = jsonStr.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson) as { headline: string; highlight: string };
      return {
        headline: parsed.headline || property.title,
        highlight: parsed.highlight || '',
      };
    } catch (err) {
      this.logger.error('Failed to parse AI thumbnail copy JSON', err);
      return { headline: property.title, highlight: '' };
    }
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private assertConfigured(): void {
    if (!this.openaiClient) {
      throw new ServiceUnavailableException('AI service not configured');
    }
  }

  private async assertPlanFeature(userId: string, feature: keyof PlanFeatures): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) return; // No subscription — allow by default (edge case)

    const features = (subscription.plan.features ?? {}) as PlanFeatures;

    if (features[feature] === false) {
      const featureLabel = this.featureLabel(feature);
      throw new ForbiddenException(
        `AI ${featureLabel} not available on current plan. Upgrade to access.`,
      );
    }
  }

  private featureLabel(feature: keyof PlanFeatures): string {
    const labels: Record<string, string> = {
      aiTitle: 'title generation',
      aiDescription: 'description generation',
      aiPitch: 'pitch generation',
      aiQA: 'Q&A',
    };
    return labels[feature as string] ?? String(feature);
  }

  private async assertOwnerAndLoad(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerUserId !== userId) throw new ForbiddenException('Access denied');

    return property;
  }

  private buildContext(property: {
    title: string;
    aiGeneratedDescription: string | null;
    propertyType: string;
    transactionType: string;
    price: { toString(): string } | null;
    location: unknown;
    specs: unknown;
    amenities: unknown;
  }): PropertyContext {
    const location = (property.location ?? {}) as Record<string, unknown>;
    const specs = (property.specs ?? {}) as Record<string, unknown>;

    return {
      title: property.title,
      aiGeneratedDescription: property.aiGeneratedDescription,
      city: typeof location['city'] === 'string' ? location['city'] : undefined,
      propertyType: property.propertyType,
      transactionType: property.transactionType,
      bedrooms:
        typeof specs['bedrooms'] === 'number' || typeof specs['bedrooms'] === 'string'
          ? specs['bedrooms']
          : undefined,
      areaSqft:
        typeof specs['areaSqft'] === 'number' || typeof specs['areaSqft'] === 'string'
          ? specs['areaSqft']
          : undefined,
      price: property.price ? property.price.toString() : null,
      specs: property.specs,
      amenities: property.amenities,
      location: property.location,
    };
  }

  isConfigured(): boolean {
    return !!this.openaiClient;
  }

  async chatConversation(
    systemPrompt: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    opts?: { temperature?: number; max_tokens?: number },
  ): Promise<string> {
    const client = this.openaiClient;
    if (!client) {
      throw new ServiceUnavailableException('AI service not configured');
    }

    const model =
      this.config.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-chat';

    try {
      const response = await client.chat.completions.create({
        model,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.max_tokens ?? 600,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
        ],
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new InternalServerErrorException('AI returned an empty response');
      }

      return content;
    } catch (err) {
      if (
        err instanceof InternalServerErrorException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }

      this.logger.error('DeepSeek API error', err instanceof Error ? err.message : String(err));
      throw new InternalServerErrorException('AI generation failed. Please try again later.');
    }
  }

  async chatComplete(
    systemPrompt: string,
    userPrompt: string,
    opts?: { temperature?: number; max_tokens?: number },
  ): Promise<string> {
    const client = this.openaiClient;
    if (!client) {
      throw new ServiceUnavailableException('AI service not configured');
    }

    const model =
      this.config.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-chat';

    try {
      const response = await client.chat.completions.create({
        model,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.max_tokens ?? 600,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new InternalServerErrorException('AI returned an empty response');
      }

      return content;
    } catch (err) {
      if (
        err instanceof InternalServerErrorException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }

      this.logger.error('DeepSeek API error', err instanceof Error ? err.message : String(err));
      throw new InternalServerErrorException('AI generation failed. Please try again later.');
    }
  }
}

