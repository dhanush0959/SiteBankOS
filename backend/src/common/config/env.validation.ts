import { z } from 'zod';

const truthy = z
  .union([z.string(), z.boolean()])
  .transform((v) => v === true || v === 'true' || v === '1');

// Treat empty strings (common in .env files) as undefined for optional fields.
const optionalUrl = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : v),
  z.string().url().optional(),
);
const optionalString = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : v),
  z.string().optional(),
);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16),

  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  GOOGLE_CALLBACK_URL: optionalUrl,

  S3_ENDPOINT: optionalUrl,
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY: optionalString,
  S3_SECRET_KEY: optionalString,
  S3_BUCKET: z.string().default('sitebank'),
  S3_PUBLIC_URL: optionalUrl,

  DEEPSEEK_API_KEY: optionalString,
  DEEPSEEK_BASE_URL: z.string().url().default('https://api.deepseek.com'),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),

  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.string().default('SiteBank <noreply@sitebank.in>'),
  FEATURE_EMAIL: truthy.default(false),

  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,
  FEATURE_PAYMENTS: truthy.default(false),

  GOOGLE_MAPS_API_KEY: optionalString,

  WHATSAPP_TOKEN: optionalString,
  WHATSAPP_PHONE_NUMBER_ID: optionalString,
  WHATSAPP_VERIFY_TOKEN: optionalString,
  WHATSAPP_WABA_ID: optionalString,
  WHATSAPP_APP_SECRET: optionalString,
  FEATURE_WHATSAPP: truthy.default(false),

  SENTRY_DSN: optionalString,
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}