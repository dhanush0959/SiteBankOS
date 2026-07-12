import * as Sentry from '@sentry/nestjs';

if (process.env['SENTRY_DSN']) {
  // Profiling is optional — skip when prebuilt binaries are not available
  // (e.g. running on a Node version without prebuilt support).
  let profilingIntegration: unknown;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const profile = require('@sentry/profiling-node') as {
      nodeProfilingIntegration?: () => unknown;
    };
    profilingIntegration = profile.nodeProfilingIntegration?.();
  } catch {
    /* profiling unavailable on this runtime */
  }

  Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    environment: process.env['NODE_ENV'] ?? 'development',
    integrations: profilingIntegration ? [profilingIntegration as never] : [],
    tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
    profilesSampleRate: profilingIntegration ? 1.0 : 0,
    enabled: process.env['NODE_ENV'] === 'production',
  });
}
