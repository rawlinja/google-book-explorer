import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { buildApp } from '../../app.js';

const mockRedis: Record<string, string> = {};
const mockTtls: Record<string, number> = {};

vi.mock('../../lib/redis.js', () => ({
  redis: {
    get: (k: string) => Promise.resolve(mockRedis[k] ?? null),
    setex: (k: string, ttl: number, v: string) => {
      mockRedis[k] = v;
      mockTtls[k] = ttl;
      return Promise.resolve('OK');
    },
    del: (k: string) => {
      delete mockRedis[k];
      return Promise.resolve(1);
    },
    on: () => {},
    quit: () => Promise.resolve(),
  },
}));

const { oauthClient } = vi.hoisted(() => ({
  oauthClient: {
    generateCodeVerifierAsync: vi.fn(),
    generateAuthUrl: vi.fn(),
    getToken: vi.fn(),
  },
}));

vi.mock('../../lib/googleOAuth.js', () => ({ createOAuthClient: () => oauthClient }));

const app = await buildApp();

beforeAll(() => app.ready());
afterAll(() => app.close());

beforeEach(() => {
  for (const k of Object.keys(mockRedis)) delete mockRedis[k];
  for (const k of Object.keys(mockTtls)) delete mockTtls[k];
  vi.clearAllMocks();
  oauthClient.generateCodeVerifierAsync.mockResolvedValue({
    codeVerifier: 'test-verifier',
    codeChallenge: 'test-challenge',
  });
  oauthClient.generateAuthUrl.mockReturnValue(
    'https://accounts.google.com/o/oauth2/v2/auth?mock=1'
  );
  oauthClient.getToken.mockResolvedValue({
    tokens: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expiry_date: Date.now() + 3_599_000,
    },
  });
});

async function appWithPendingLogin(
  configure?: (app: Awaited<ReturnType<typeof buildApp>>) => void
) {
  const pending = await buildApp();
  pending.addHook('preHandler', async (req) => {
    req.session.codeVerifier = 'test-verifier';
    req.session.state = 'test-state';
  });
  configure?.(pending);
  await pending.ready();
  return pending;
}

function storedTokens() {
  const key = Object.keys(mockRedis).find((k) => k.startsWith('tokens:'));
  return key ? JSON.parse(mockRedis[key]) : undefined;
}

function storedTokenTtl() {
  const key = Object.keys(mockTtls).find((k) => k.startsWith('tokens:'));
  return key ? mockTtls[key] : undefined;
}

describe('GET /auth/google', () => {
  it('asks Google for offline access so a refresh token is issued', async () => {
    await app.inject({ method: 'GET', url: '/auth/google' });

    expect(oauthClient.generateAuthUrl).toHaveBeenCalledWith(
      expect.objectContaining({ access_type: 'offline' })
    );
  });

  it('redirects to the Google URL with an S256 PKCE challenge and state', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/google' });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain('accounts.google.com');
    expect(oauthClient.generateAuthUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        code_challenge: 'test-challenge',
        code_challenge_method: 'S256',
        state: expect.any(String),
      })
    );
  });

  it('stores the verifier and the state sent to Google in the session', async () => {
    let captured: Record<string, unknown> = {};
    const pkceApp = await buildApp();
    pkceApp.addHook('onSend', async (req) => {
      captured = { codeVerifier: req.session.codeVerifier, state: req.session.state };
    });
    await pkceApp.ready();

    await pkceApp.inject({ method: 'GET', url: '/auth/google' });

    const sentState = oauthClient.generateAuthUrl.mock.calls[0][0].state;
    expect(sentState).toMatch(/^[\w-]{43}$/);
    expect(captured).toEqual({ codeVerifier: 'test-verifier', state: sentState });

    await pkceApp.close();
  });
});

describe('GET /auth/google/callback', () => {
  it('exchanges the code, stores the tokens and redirects to /auth-signed-in', async () => {
    const pending = await appWithPendingLogin();

    const res = await pending.inject({
      method: 'GET',
      url: '/auth/google/callback?code=mock-code&state=test-state',
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth-signed-in');
    expect(oauthClient.getToken).toHaveBeenCalledWith({
      code: 'mock-code',
      codeVerifier: 'test-verifier',
    });
    expect(storedTokens()).toMatchObject({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expiry_date: expect.any(Number),
    });

    await pending.close();
  });

  it('keeps tokens and the session for 7 days when a refresh token is issued', async () => {
    let expiresAt: number | undefined;
    const pending = await appWithPendingLogin((app) =>
      app.addHook('onSend', async (req) => {
        expiresAt = req.session.expiresAt;
      })
    );

    await pending.inject({
      method: 'GET',
      url: '/auth/google/callback?code=mock-code&state=test-state',
    });

    expect(storedTokenTtl()).toBe(604800);
    expect(expiresAt! - Date.now()).toBeGreaterThan(604790 * 1000);

    await pending.close();
  });

  it('limits tokens and the session to the access token lifetime without a refresh token', async () => {
    oauthClient.getToken.mockResolvedValueOnce({
      tokens: { access_token: 'mock-access-token', expiry_date: Date.now() + 3_599_000 },
    });
    let expiresAt: number | undefined;
    const pending = await appWithPendingLogin((app) =>
      app.addHook('onSend', async (req) => {
        expiresAt = req.session.expiresAt;
      })
    );

    await pending.inject({
      method: 'GET',
      url: '/auth/google/callback?code=mock-code&state=test-state',
    });

    expect(storedTokenTtl()).toBeGreaterThan(3590);
    expect(storedTokenTtl()).toBeLessThanOrEqual(3599);
    expect(expiresAt! - Date.now()).toBeLessThanOrEqual(3_599_000);

    await pending.close();
  });

  it('redirects to /authorize without exchanging when state does not match', async () => {
    const pending = await appWithPendingLogin();

    const res = await pending.inject({
      method: 'GET',
      url: '/auth/google/callback?code=mock-code&state=forged-state',
    });

    expect(res.headers.location).toBe('/authorize');
    expect(oauthClient.getToken).not.toHaveBeenCalled();

    await pending.close();
  });

  it('redirects to /authorize when Google sends no code', async () => {
    const pending = await appWithPendingLogin();

    const res = await pending.inject({
      method: 'GET',
      url: '/auth/google/callback?error=access_denied&state=test-state',
    });

    expect(res.headers.location).toBe('/authorize');
    expect(oauthClient.getToken).not.toHaveBeenCalled();

    await pending.close();
  });

  it('redirects to /authorize when the code exchange fails', async () => {
    oauthClient.getToken.mockRejectedValueOnce(new Error('invalid_grant'));
    const pending = await appWithPendingLogin();

    const res = await pending.inject({
      method: 'GET',
      url: '/auth/google/callback?code=bad-code&state=test-state',
    });

    expect(res.headers.location).toBe('/authorize');

    await pending.close();
  });

  it('redirects to /authorize when the session has no pending login', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/google/callback?code=mock-code&state=test-state',
    });

    expect(res.headers.location).toBe('/authorize');
  });
});

describe('POST /auth/logout', () => {
  it('returns ok and calls Redis del to remove the token', async () => {
    const { redis } = await import('../../lib/redis.js');
    const delSpy = vi.spyOn(redis, 'del');

    const res = await app.inject({ method: 'POST', url: '/auth/logout' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    expect(delSpy).toHaveBeenCalledWith(expect.stringMatching(/^tokens:/));
  });
});
