import { describe, it, expect, vi, beforeEach } from 'vitest';

const VALID_ENV = {
  NODE_ENV: 'test',
  PORT: '3001',
  SESSION_SECRET: 'test-secret-must-be-at-least-32-chars!!',
  CORS_ORIGIN: 'http://localhost:3000',
  REDIS_URL: 'redis://localhost:6379',
  GOOGLE_CLIENT_ID: 'test-client-id',
  GOOGLE_CLIENT_SECRET: 'test-client-secret',
  GOOGLE_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
  OPENAI_API_KEY: 'test-openai-key',
  GOOGLE_BOOKS_API_KEY: 'test-books-key',
};

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
});

describe('config', () => {
  it('parses valid env without error', async () => {
    vi.stubEnv('SESSION_SECRET', VALID_ENV.SESSION_SECRET);
    const { config } = await import('../../config/index.js');
    expect(config.PORT).toBe(3001);
    expect(config.NODE_ENV).toBe('test');
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('calls process.exit(1) when SESSION_SECRET is too short', async () => {
    vi.stubEnv('SESSION_SECRET', 'tooshort');
    await import('../../config/index.js');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('calls process.exit(1) when a required var is missing', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    await import('../../config/index.js');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('coerces PORT from string to number', async () => {
    vi.stubEnv('SESSION_SECRET', VALID_ENV.SESSION_SECRET);
    vi.stubEnv('PORT', '4000');
    const { config } = await import('../../config/index.js');
    expect(config.PORT).toBe(4000);
  });
});
