import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'test/e2e/**'],
  },
  resolve: {
    alias: {
      '@sitebank/types': path.resolve(__dirname, '../../packages/types/src'),
    },
  },
});
