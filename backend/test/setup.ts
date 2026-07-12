// Vitest global setup. Aliases `jest` → `vi` so tests written either way work.
import { vi, beforeAll } from 'vitest';

declare global {
  // eslint-disable-next-line no-var
  var jest: typeof vi;
}

beforeAll(() => {
  globalThis.jest = vi;
});

globalThis.jest = vi;

process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = process.env['JWT_SECRET'] ?? 'test-secret-32chars-min-aaaaaaaa';
process.env['JWT_REFRESH_SECRET'] =
  process.env['JWT_REFRESH_SECRET'] ?? 'test-refresh-32chars-min-bbbbbbbb';
process.env['DATABASE_URL'] =
  process.env['DATABASE_URL'] ?? 'postgresql://test:test@localhost:5432/sitebank_test';
