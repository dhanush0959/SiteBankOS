/**
 * AI prompt templates for SiteBank's DeepSeek integration.
 * All prompts are kept concise, factual, and India-real-estate focused.
 */

export interface PropertyContext {
  city?: string;
  propertyType?: string;
  transactionType?: string;
  bedrooms?: number | string;
  areaSqft?: number | string;
  price?: string | null;
  amenities?: unknown;
  specs?: unknown;
  location?: unknown;
  title?: string;
  aiGeneratedDescription?: string | null;
}

export function buildTitleSystemPrompt(): string {
  return (
    'You are an Indian real-estate listing copywriter. ' +
    'Given the property details below, write ONE catchy, factual title in English (max 90 chars). ' +
    'Avoid clichés ("amazing", "dream"). ' +
    'Include the city and key spec. ' +
    'Output ONLY the title — no quotes, no commentary.'
  );
}

export function buildTitleUserPrompt(ctx: PropertyContext): string {
  return [
    `City: ${ctx.city ?? 'N/A'}`,
    `Property Type: ${ctx.propertyType ?? 'N/A'}`,
    `Transaction Type: ${ctx.transactionType ?? 'N/A'}`,
    `Bedrooms: ${ctx.bedrooms ?? 'N/A'}`,
    `Area (sqft): ${ctx.areaSqft ?? 'N/A'}`,
    `Price: ${ctx.price ?? 'N/A'}`,
  ].join('\n');
}

export function buildDescriptionSystemPrompt(): string {
  return (
    'Write a 200–400 word property description for an Indian agent listing. ' +
    'Include: location/connectivity, property type & layout, key features (specs/amenities), ' +
    'suitability (ideal for X). ' +
    'Do NOT make up amenities not listed. ' +
    'Tone: confident, factual.'
  );
}

export function buildDescriptionUserPrompt(ctx: PropertyContext): string {
  return [
    `City: ${ctx.city ?? 'N/A'}`,
    `Property Type: ${ctx.propertyType ?? 'N/A'}`,
    `Transaction Type: ${ctx.transactionType ?? 'N/A'}`,
    `Bedrooms: ${ctx.bedrooms ?? 'N/A'}`,
    `Area (sqft): ${ctx.areaSqft ?? 'N/A'}`,
    `Price: ${ctx.price ?? 'N/A'}`,
    `Specs: ${JSON.stringify(ctx.specs ?? {})}`,
    `Amenities: ${JSON.stringify(ctx.amenities ?? {})}`,
    `Location details: ${JSON.stringify(ctx.location ?? {})}`,
  ].join('\n');
}

const LANG_NAMES: Record<string, string> = {
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  mr: 'Marathi',
  bn: 'Bengali',
  en: 'English',
};

export function buildTranslateSystemPrompt(targetLang: string): string {
  const langName = LANG_NAMES[targetLang] ?? targetLang;
  return (
    `Translate the following text to ${langName}. ` +
    'Preserve numerals and Indian terms (lakh, crore). ' +
    'Output only the translation.'
  );
}

export function buildQASystemPrompt(): string {
  return (
    "Given this property listing, answer the buyer's question concisely in 2-3 sentences. " +
    "If unknown from listing, say 'Please contact the agent for details.'"
  );
}

export function buildQAUserPrompt(ctx: PropertyContext, question: string): string {
  const description = ctx.aiGeneratedDescription ?? ctx.title ?? '';
  return [
    `Property title: ${ctx.title ?? 'N/A'}`,
    `City: ${ctx.city ?? 'N/A'}`,
    `Property Type: ${ctx.propertyType ?? 'N/A'}`,
    `Transaction Type: ${ctx.transactionType ?? 'N/A'}`,
    `Bedrooms: ${ctx.bedrooms ?? 'N/A'}`,
    `Area (sqft): ${ctx.areaSqft ?? 'N/A'}`,
    `Price: ${ctx.price ?? 'N/A'}`,
    `Specs: ${JSON.stringify(ctx.specs ?? {})}`,
    `Amenities: ${JSON.stringify(ctx.amenities ?? {})}`,
    `Description: ${description}`,
    '',
    `Buyer's question: ${question}`,
  ].join('\n');
}

export function buildPitchSystemPrompt(
  audience: 'buyer' | 'investor' | 'tenant',
  tone: 'formal' | 'casual',
): string {
  const audienceGuide: Record<string, string> = {
    buyer: 'a home buyer looking for their next residence',
    investor: 'a real-estate investor focused on ROI and capital appreciation',
    tenant: 'a tenant seeking a rental home or commercial space',
  };
  const toneGuide = tone === 'formal' ? 'professional and formal' : 'conversational and friendly';

  return (
    `Write an 80-120 word property pitch in ${toneGuide} tone for ${audienceGuide[audience] ?? audience}. ` +
    'Highlight the most compelling aspects of the property. ' +
    'Keep it WhatsApp-ready: short, punchy, and persuasive. ' +
    'Output only the pitch paragraph — no subject line, no signature.'
  );
}

export function buildPitchUserPrompt(ctx: PropertyContext): string {
  return buildDescriptionUserPrompt(ctx);
}

export function buildThumbnailCopySystemPrompt(): string {
  return (
    'You are a real-estate marketing expert. ' +
    'Given property details, generate a short, punchy headline and ONE key selling point for a social media poster. ' +
    'Headline: Max 35 chars. ' +
    'Key Highlight: Max 45 chars. ' +
    'Output as JSON: {"headline": "...", "highlight": "..."}. ' +
    'Be extremely concise. Use Indian real estate context (e.g. "Luxury 3BHK", "Prime Plot").'
  );
}

export function buildThumbnailCopyUserPrompt(ctx: PropertyContext): string {
  return [
    `City: ${ctx.city ?? 'N/A'}`,
    `Property Type: ${ctx.propertyType ?? 'N/A'}`,
    `Transaction Type: ${ctx.transactionType ?? 'N/A'}`,
    `Bedrooms: ${ctx.bedrooms ?? 'N/A'}`,
    `Area (sqft): ${ctx.areaSqft ?? 'N/A'}`,
    `Price: ${ctx.price ?? 'N/A'}`,
    `Amenities: ${JSON.stringify(ctx.amenities ?? {})}`,
  ].join('\n');
}
