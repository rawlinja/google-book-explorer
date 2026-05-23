import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../../app.js';

vi.mock('../../plugins/redis.js', async () => {
  const { default: fp } = await import('fastify-plugin');
  return {
    default: fp(async (fastify: any) => {
      const store: Record<string, string> = {};
      fastify.decorate('redis', {
        get: (k: string) => Promise.resolve(store[k] ?? null),
        setex: (k: string, _ttl: number, v: string) => { store[k] = v; return Promise.resolve('OK'); },
        del: (k: string) => { delete store[k]; return Promise.resolve(1); },
        on: () => {},
        quit: () => Promise.resolve(),
      });
    }),
  };
});


vi.mock('openid-client', async () => {
  const actual = await vi.importActual<typeof import('openid-client')>('openid-client');
  return { ...actual, discovery: vi.fn().mockResolvedValue({}) };
});

const app = await buildApp();

beforeAll(() => app.ready());
afterAll(() => app.close());

describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
});

describe('GET /api/me', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/me' });
    expect(res.statusCode).toBe(401);
  });
});

describe('requireAuth', () => {
  it('returns 401 on protected routes without session', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/books/search?q=test' });
    expect(res.statusCode).toBe(401);
  });
});
