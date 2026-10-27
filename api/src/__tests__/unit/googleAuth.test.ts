import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyBaseLogger } from 'fastify';
import type { OAuth2Client } from 'google-auth-library';

const { fakeRedis, booksFactory } = vi.hoisted(() => ({
  fakeRedis: { get: vi.fn(), setex: vi.fn(), set: vi.fn() },
  booksFactory: vi.fn((_options: { version: string; auth: OAuth2Client }) => ({})),
}));

vi.mock('../../lib/redis.js', () => ({ redis: fakeRedis }));
vi.mock('@googleapis/books', () => ({ books: booksFactory }));

const { getTokens, saveTokens, updateTokens, createUserClient } =
  await import('../../lib/googleAuth.js');

const STORED = { access_token: 'access-old', refresh_token: 'refresh', expiry_date: 1_000 };
const log = { error: vi.fn() } as unknown as FastifyBaseLogger;

beforeEach(() => {
  vi.clearAllMocks();
  fakeRedis.get.mockResolvedValue(JSON.stringify(STORED));
  fakeRedis.setex.mockResolvedValue('OK');
  fakeRedis.set.mockResolvedValue('OK');
});

function oauthClientGivenToBooks(): OAuth2Client {
  return booksFactory.mock.calls[0][0].auth;
}

describe('getTokens', () => {
  it('reads the session tokens from Redis', async () => {
    expect(await getTokens('session-id')).toEqual(STORED);
    expect(fakeRedis.get).toHaveBeenCalledWith('tokens:session-id');
  });

  it('throws when no tokens are stored', async () => {
    fakeRedis.get.mockResolvedValueOnce(null);

    await expect(getTokens('session-id')).rejects.toThrow('No tokens found for session');
  });
});

describe('saveTokens', () => {
  it('writes the tokens with the given TTL', async () => {
    await saveTokens('session-id', STORED, 600);

    expect(fakeRedis.setex).toHaveBeenCalledWith('tokens:session-id', 600, JSON.stringify(STORED));
  });
});

describe('updateTokens', () => {
  it('keeps the existing TTL', async () => {
    await updateTokens('session-id', STORED);

    expect(fakeRedis.set).toHaveBeenCalledWith(
      'tokens:session-id',
      JSON.stringify(STORED),
      'KEEPTTL'
    );
  });
});

describe('createUserClient', () => {
  it('builds a books client authorized with the stored tokens', async () => {
    await createUserClient('session-id', log);

    expect(booksFactory).toHaveBeenCalledWith(expect.objectContaining({ version: 'v1' }));
    expect(oauthClientGivenToBooks().credentials).toEqual(STORED);
  });

  it('saves refreshed tokens and keeps the stored refresh token', async () => {
    await createUserClient('session-id', log);

    oauthClientGivenToBooks().emit('tokens', { access_token: 'access-new', expiry_date: 2_000 });

    await vi.waitFor(() =>
      expect(fakeRedis.set).toHaveBeenCalledWith(
        'tokens:session-id',
        JSON.stringify({
          access_token: 'access-new',
          refresh_token: 'refresh',
          expiry_date: 2_000,
        }),
        'KEEPTTL'
      )
    );
  });

  it('logs instead of throwing when saving refreshed tokens fails', async () => {
    const err = new Error('redis down');
    fakeRedis.set.mockRejectedValueOnce(err);
    await createUserClient('session-id', log);

    oauthClientGivenToBooks().emit('tokens', { access_token: 'access-new' });

    await vi.waitFor(() =>
      expect(log.error).toHaveBeenCalledWith({ err }, 'auth.tokens.save_failed')
    );
  });

  it('throws when the session has no tokens', async () => {
    fakeRedis.get.mockResolvedValueOnce(null);

    await expect(createUserClient('session-id', log)).rejects.toThrow(
      'No tokens found for session'
    );
  });
});
