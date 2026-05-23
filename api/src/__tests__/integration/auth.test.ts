import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../../app.js';

const mockRedis: Record<string, string> = {};

vi.mock('../../plugins/redis.js', async () => {
  const { default: fp } = await import('fastify-plugin');
  return {
    default: fp(async (fastify: any) => {
      fastify.decorate('redis', {
        get: (k: string) => Promise.resolve(mockRedis[k] ?? null),
        setex: (k: string, _ttl: number, v: string) => {
          mockRedis[k] = v;
          return Promise.resolve('OK');
        },
        del: (k: string) => {
          delete mockRedis[k];
          return Promise.resolve(1);
        },
        on: () => {},
        quit: () => Promise.resolve(),
      });
    }),
  };
});

vi.mock('openid-client', async () => {
  const actual = await vi.importActual<typeof import('openid-client')>('openid-client');
  return {
    ...actual,
    discovery: vi.fn().mockResolvedValue({}),
    randomPKCECodeVerifier: vi.fn().mockReturnValue('test-verifier'),
    calculatePKCECodeChallenge: vi.fn().mockResolvedValue('test-challenge'),
    randomState: vi.fn().mockReturnValue('test-state'),
    buildAuthorizationUrl: vi.fn().mockReturnValue(new URL('https://accounts.google.com/o/oauth2/auth?mock=1')),
    authorizationCodeGrant: vi.fn().mockResolvedValue({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      id_token: 'mock-id-token',
    }),
  };
});

const app = await buildApp();

beforeAll(() => app.ready());
afterAll(() => app.close());

describe('GET /auth/google', () => {
  it('redirects to Google OAuth', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/google' });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain('accounts.google.com');
  });
});

describe('GET /auth/google/callback', () => {
  it('redirects to /auth-signed-in and stores tokens in Redis on success', async () => {
    const authedApp = await buildApp();
    authedApp.addHook('preHandler', async (req) => {
      req.session.codeVerifier = 'test-verifier';
      req.session.state = 'test-state';
    });
    await authedApp.ready();

    const res = await authedApp.inject({
      method: 'GET',
      url: '/auth/google/callback?code=mock-code&state=test-state',
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth-signed-in');

    const sessionId = Object.keys(mockRedis).find((k) => k.startsWith('tokens:'));
    expect(sessionId).toBeDefined();
    const stored = JSON.parse(mockRedis[sessionId!]);
    expect(stored.accessToken).toBe('mock-access-token');
    expect(stored.refreshToken).toBe('mock-refresh-token');

    await authedApp.close();
  });

  it('redirects to /authorize when the callback fails', async () => {
    const { authorizationCodeGrant } = await import('openid-client');
    vi.mocked(authorizationCodeGrant).mockRejectedValueOnce(new Error('invalid_grant'));

    const res = await app.inject({
      method: 'GET',
      url: '/auth/google/callback?code=bad-code&state=wrong-state',
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/authorize');
  });
});

describe('POST /auth/logout', () => {
  it('returns ok and calls Redis del to remove the token', async () => {
    const delSpy = vi.fn().mockResolvedValue(1);

    const logoutApp = await buildApp();
    // Override just the del spy on the already-registered redis decorator
    logoutApp.addHook('onRequest', async (req) => {
      (req.server as any).redis.del = delSpy;
    });
    await logoutApp.ready();

    const res = await logoutApp.inject({ method: 'POST', url: '/auth/logout' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    expect(delSpy).toHaveBeenCalledWith(expect.stringMatching(/^tokens:/));

    await logoutApp.close();
  });
});
