import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../../app.js';

vi.mock('../../lib/redis.js', () => {
  const store: Record<string, string> = {};
  return {
    redis: {
      get: (k: string) => Promise.resolve(store[k] ?? null),
      setex: (k: string, _ttl: number, v: string) => {
        store[k] = v;
        return Promise.resolve('OK');
      },
      del: (k: string) => {
        delete store[k];
        return Promise.resolve(1);
      },
      on: () => {},
      quit: () => Promise.resolve(),
    },
  };
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
