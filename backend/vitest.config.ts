import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    deps: {
      inline: ['supertest', 'express'],
    },
  },
  esbuild: {
    target: 'es2020',
    format: 'esm',
  },
});
