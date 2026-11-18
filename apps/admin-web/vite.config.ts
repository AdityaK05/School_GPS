import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react({}), tailwindcss()],
  resolve: {
    alias: {
      '@school-transport-platform/client-sdk': path.resolve(__dirname, '../../packages/client-sdk/src'),
      '@school-transport-platform/constants': path.resolve(__dirname, '../../packages/constants/src'),
      '@school-transport-platform/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@school-transport-platform/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@school-transport-platform/validation': path.resolve(__dirname, '../../packages/validation/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
