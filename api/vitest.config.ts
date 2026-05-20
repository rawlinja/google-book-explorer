import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      PORT: '3001',
      SESSION_SECRET: 'test-secret-must-be-at-least-32-chars!!',
      CORS_ORIGIN: 'http://localhost:3000',
      REDIS_URL: 'redis://localhost:6379',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:3001/auth/google/callback',
      OPENAI_API_KEY: 'test-openai-key',
      GOOGLE_BOOKS_API_KEY: 'test-books-key',
    },
  },
  esbuild: {
    target: 'es2022',
    format: 'esm',
  },
});
