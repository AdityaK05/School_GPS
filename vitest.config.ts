import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@school-transport-platform/constants': path.resolve(__dirname, 'packages/constants/src/index.ts'),
      '@school-transport-platform/shared-types': path.resolve(__dirname, 'packages/shared-types/src/index.ts'),
      '@school-transport-platform/utils': path.resolve(__dirname, 'packages/utils/src/index.ts'),
      '@school-transport-platform/validation': path.resolve(__dirname, 'packages/validation/src/index.ts'),
      '@school-transport-platform/client-sdk': path.resolve(__dirname, 'packages/client-sdk/src/index.ts'),
    },
  },
});
