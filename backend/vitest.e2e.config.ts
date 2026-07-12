import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import * as path from 'path';

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['test/e2e/**/*.spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@sitebank/types': path.resolve(__dirname, '../../packages/types/src'),
    },
  },
});
