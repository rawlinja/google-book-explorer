import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('openid-client', async () => {
  const actual = await vi.importActual<typeof import('openid-client')>('openid-client');
  return {
    ...actual,
    discovery: vi.fn().mockResolvedValue({}),
    refreshTokenGrant: vi.fn(),
  };
});

const STORED_TOKENS = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  idToken: 'id-token',
};

const REFRESHED_TOKENS = {
  access_token: 'access-token-new',
  refresh_token: 'refresh-token-new',
  id_token: 'id-token-new',
};

function makeRedisMock(tokenJson = JSON.stringify(STORED_TOKENS)) {
  return {
    get: vi.fn().mockResolvedValue(tokenJson),
    setex: vi.fn().mockResolvedValue('OK'),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
});

describe('getTokens', () => {
  it('returns parsed tokens from Redis', async () => {
    const redis = makeRedisMock();
    const { getTokens } = await import('../../lib/googleAuth.js');
    const tokens = await getTokens('session-id', redis as any);
    expect(tokens).toEqual(STORED_TOKENS);
    expect(redis.get).toHaveBeenCalledWith('tokens:session-id');
  });

  it('throws when no tokens are stored for the session', async () => {
    const redis = makeRedisMock('');
    redis.get.mockResolvedValueOnce(null);
    const { getTokens } = await import('../../lib/googleAuth.js');
    await expect(getTokens('session-id', redis as any)).rejects.toThrow(
      'No tokens found for session'
    );
  });
});

describe('refreshAndSave', () => {
  it('exchanges refresh token and writes updated tokens to Redis', async () => {
    const redis = makeRedisMock();
    const { refreshTokenGrant } = await import('openid-client');
    vi.mocked(refreshTokenGrant).mockResolvedValueOnce(REFRESHED_TOKENS as any);

    const { refreshAndSave } = await import('../../lib/googleAuth.js');
    const updated = await refreshAndSave('session-id', STORED_TOKENS, redis as any);

    expect(updated.accessToken).toBe('access-token-new');
    expect(updated.refreshToken).toBe('refresh-token-new');
    expect(redis.setex).toHaveBeenCalledWith('tokens:session-id', 3600, JSON.stringify(updated));
  });

  it('retains the original refresh token if the server does not rotate it', async () => {
    const redis = makeRedisMock();
    const { refreshTokenGrant } = await import('openid-client');
    vi.mocked(refreshTokenGrant).mockResolvedValueOnce({
      access_token: 'access-token-new',
      refresh_token: undefined,
      id_token: 'id-token-new',
    } as any);

    const { refreshAndSave } = await import('../../lib/googleAuth.js');
    const updated = await refreshAndSave('session-id', STORED_TOKENS, redis as any);

    expect(updated.refreshToken).toBe('refresh-token');
  });

  it('throws when there is no refresh token', async () => {
    const redis = makeRedisMock();
    const { refreshAndSave } = await import('../../lib/googleAuth.js');
    const noRefresh = { ...STORED_TOKENS, refreshToken: null };
    await expect(refreshAndSave('session-id', noRefresh, redis as any)).rejects.toThrow(
      'No refresh token available'
    );
  });
});

describe('authorizedFetch', () => {
  it('attaches the access token as a Bearer header', async () => {
    const redis = makeRedisMock();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { authorizedFetch } = await import('../../lib/googleAuth.js');
    await authorizedFetch('https://example.com', {}, 'session-id', redis as any);

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      })
    );
  });

  it('refreshes the token on 401 and retries', async () => {
    const redis = makeRedisMock();
    const { refreshTokenGrant } = await import('openid-client');
    vi.mocked(refreshTokenGrant).mockResolvedValueOnce(REFRESHED_TOKENS as any);

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { authorizedFetch } = await import('../../lib/googleAuth.js');
    const res = await authorizedFetch('https://example.com', {}, 'session-id', redis as any);

    expect(refreshTokenGrant).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(200);
  });

  it('returns the 401 response without retry when there is no refresh token', async () => {
    const tokens = { ...STORED_TOKENS, refreshToken: null };
    const redis = makeRedisMock(JSON.stringify(tokens));

    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));

    const { authorizedFetch } = await import('../../lib/googleAuth.js');
    await expect(
      authorizedFetch('https://example.com', {}, 'session-id', redis as any)
    ).rejects.toThrow('No refresh token available');
  });
});
