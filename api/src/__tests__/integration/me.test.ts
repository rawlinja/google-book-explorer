import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../../app.js';

vi.mock('../../plugins/redis.js', async () => {
  const { default: fp } = await import('fastify-plugin');
  return {
    default: fp(async (fastify: any) => {
      fastify.decorate('redis', {
        get: vi.fn().mockResolvedValue(null),
        setex: vi.fn().mockResolvedValue('OK'),
        del: vi.fn().mockResolvedValue(1),
        on: () => {},
        quit: vi.fn().mockResolvedValue(undefined),
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

describe('GET /api/me', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/me' });
    expect(res.statusCode).toBe(401);
  });

  it('returns isLoggedIn and expiresAt when authenticated', async () => {
    const expiresAt = Date.now() + 3600000;

    const authedApp = await buildApp();
    authedApp.addHook('preHandler', async (req) => {
      req.session.authenticated = true;
      req.session.expiresAt = expiresAt;
    });
    await authedApp.ready();

    const res = await authedApp.inject({ method: 'GET', url: '/api/me' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.isLoggedIn).toBe(true);
    expect(body.expiresAt).toBe(expiresAt);

    await authedApp.close();
  });
});
