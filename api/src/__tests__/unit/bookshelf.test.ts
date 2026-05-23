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
  accessToken: 'access-token-old',
  refreshToken: 'refresh-token',
  idToken: 'id-token',
};

const REFRESHED_TOKENS = {
  access_token: 'access-token-new',
  refresh_token: 'refresh-token-new',
  id_token: 'id-token-new',
};

const MOCK_SHELVES_RESPONSE = {
  items: [
    { id: 2, title: 'To Read', volumeCount: 3 },
    { id: 4, title: 'Have Read', volumeCount: 7 },
  ],
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

describe('getBookshelves - read-only shelf filtering', () => {
  it('excludes read-only shelves from the result', async () => {
    const redis = makeRedisMock();
    const allShelves = {
      items: [
        { id: 1, title: 'My Google eBooks', volumeCount: 3 },   // read-only
        { id: 2, title: 'Favorites', volumeCount: 5 },
        { id: 3, title: 'Reading Now', volumeCount: 1 },
        { id: 4, title: 'To Read', volumeCount: 8 },
        { id: 5, title: 'Have Read', volumeCount: 12 },          // read-only
        { id: 6, title: 'Books For You', volumeCount: 0 },       // read-only
        { id: 7, title: 'My eBooks', volumeCount: 2 },           // read-only
        { id: 8, title: 'Purchased', volumeCount: 4 },           // read-only
        { id: 9, title: 'Recently Viewed', volumeCount: 1 },     // read-only
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(allShelves), { status: 200 })
    );

    const { getBookshelves } = await import('../../services/bookshelf.js');
    const shelves = await getBookshelves('session-id', redis as any);

    expect(shelves.map((s) => s.id)).toEqual([2, 3, 4]);
  });
});

describe('getBookshelves - token refresh', () => {
  it('refreshes token on 401 and retries the request', async () => {
    const redis = makeRedisMock();
    const { refreshTokenGrant } = await import('openid-client');
    vi.mocked(refreshTokenGrant).mockResolvedValueOnce(REFRESHED_TOKENS as any);

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(MOCK_SHELVES_RESPONSE), { status: 200 }));

    const { getBookshelves } = await import('../../services/bookshelf.js');
    const shelves = await getBookshelves('session-id', redis as any);

    expect(refreshTokenGrant).toHaveBeenCalledOnce();
    expect(redis.setex).toHaveBeenCalledWith(
      'tokens:session-id',
      3600,
      JSON.stringify({
        accessToken: 'access-token-new',
        refreshToken: 'refresh-token-new',
        idToken: 'id-token-new',
      })
    );
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(shelves).toHaveLength(2);
    expect(shelves[0].title).toBe('To Read');
  });

  it('retains the original refresh token if the server does not rotate it', async () => {
    const redis = makeRedisMock();
    const { refreshTokenGrant } = await import('openid-client');
    vi.mocked(refreshTokenGrant).mockResolvedValueOnce({
      access_token: 'access-token-new',
      refresh_token: undefined,
      id_token: 'id-token-new',
    } as any);

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(MOCK_SHELVES_RESPONSE), { status: 200 }));

    const { getBookshelves } = await import('../../services/bookshelf.js');
    await getBookshelves('session-id', redis as any);

    const saved = JSON.parse(vi.mocked(redis.setex).mock.calls[0][2]);
    expect(saved.refreshToken).toBe('refresh-token');
  });
});

describe('addToShelf', () => {
  it('calls the addVolume endpoint with the correct URL', async () => {
    const redis = makeRedisMock();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { addToShelf } = await import('../../services/bookshelf.js');
    await addToShelf('session-id', 2, 'vol123', redis as any);

    expect(fetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/books/v1/mylibrary/bookshelves/2/addVolume?volumeId=vol123',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('refreshes token on 401 and retries the request', async () => {
    const redis = makeRedisMock();
    const { refreshTokenGrant } = await import('openid-client');
    vi.mocked(refreshTokenGrant).mockResolvedValueOnce(REFRESHED_TOKENS as any);

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { addToShelf } = await import('../../services/bookshelf.js');
    await addToShelf('session-id', 2, 'vol123', redis as any);

    expect(refreshTokenGrant).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws when the Google API returns an error', async () => {
    const redis = makeRedisMock();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 400 }));

    const { addToShelf } = await import('../../services/bookshelf.js');
    await expect(addToShelf('session-id', 2, 'vol123', redis as any)).rejects.toThrow(
      'Google Bookshelf API error: 400'
    );
  });

  it('throws when no tokens are stored for the session', async () => {
    const redis = { get: vi.fn().mockResolvedValue(null), setex: vi.fn() };

    const { addToShelf } = await import('../../services/bookshelf.js');
    await expect(addToShelf('no-session', 2, 'vol123', redis as any)).rejects.toThrow(
      'No tokens found for session'
    );
  });
});

describe('removeFromShelf', () => {
  it('calls the removeVolume endpoint with the correct URL', async () => {
    const redis = makeRedisMock();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { removeFromShelf } = await import('../../services/bookshelf.js');
    await removeFromShelf('session-id', 2, 'vol123', redis as any);

    expect(fetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/books/v1/mylibrary/bookshelves/2/removeVolume?volumeId=vol123',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('refreshes token on 401 and retries the request', async () => {
    const redis = makeRedisMock();
    const { refreshTokenGrant } = await import('openid-client');
    vi.mocked(refreshTokenGrant).mockResolvedValueOnce(REFRESHED_TOKENS as any);

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { removeFromShelf } = await import('../../services/bookshelf.js');
    await removeFromShelf('session-id', 2, 'vol123', redis as any);

    expect(refreshTokenGrant).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws when the Google API returns an error', async () => {
    const redis = makeRedisMock();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 400 }));

    const { removeFromShelf } = await import('../../services/bookshelf.js');
    await expect(removeFromShelf('session-id', 2, 'vol123', redis as any)).rejects.toThrow(
      'Google Bookshelf API error: 400'
    );
  });

  it('throws when no tokens are stored for the session', async () => {
    const redis = { get: vi.fn().mockResolvedValue(null), setex: vi.fn() };

    const { removeFromShelf } = await import('../../services/bookshelf.js');
    await expect(removeFromShelf('no-session', 2, 'vol123', redis as any)).rejects.toThrow(
      'No tokens found for session'
    );
  });
});
