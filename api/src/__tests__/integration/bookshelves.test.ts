import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../../app.js';

vi.mock('../../hooks/requireAuth.js', () => ({
  requireAuth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/bookshelf.js', () => ({
  getBookshelves: vi.fn(),
  addToShelf: vi.fn(),
  removeFromShelf: vi.fn(),
}));

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

const MOCK_SHELVES = [
  { id: 2, title: 'To Read', volumeCount: 5 },
  { id: 3, title: 'Reading Now', volumeCount: 2 },
  { id: 4, title: 'Have Read', volumeCount: 12 },
];

const app = await buildApp();

beforeAll(() => app.ready());
afterAll(() => app.close());

describe('GET /api/bookshelves', () => {
  it('returns shelf list', async () => {
    const { getBookshelves } = await import('../../services/bookshelf.js');
    vi.mocked(getBookshelves).mockResolvedValueOnce(MOCK_SHELVES);

    const res = await app.inject({ method: 'GET', url: '/api/bookshelves' });
    expect(res.statusCode).toBe(200);
    expect(res.json().shelves).toEqual(MOCK_SHELVES);
  });

  it('returns 502 when the bookshelf service throws', async () => {
    const { getBookshelves } = await import('../../services/bookshelf.js');
    vi.mocked(getBookshelves).mockRejectedValueOnce(new Error('Google API error: 500'));

    const res = await app.inject({ method: 'GET', url: '/api/bookshelves' });
    expect(res.statusCode).toBe(502);
  });
});

describe('POST /api/bookshelves/:shelfId/add', () => {
  it('returns { ok: true } on success', async () => {
    const { addToShelf } = await import('../../services/bookshelf.js');
    vi.mocked(addToShelf).mockResolvedValueOnce(undefined);

    const res = await app.inject({
      method: 'POST',
      url: '/api/bookshelves/2/add?volumeId=abc123',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('calls addToShelf with the correct shelfId and volumeId', async () => {
    const { addToShelf } = await import('../../services/bookshelf.js');
    const mock = vi.mocked(addToShelf);
    mock.mockResolvedValueOnce(undefined);

    await app.inject({ method: 'POST', url: '/api/bookshelves/4/add?volumeId=xyz789' });
    expect(mock).toHaveBeenCalledWith(expect.any(String), 4, 'xyz789', expect.anything());
  });

  it('returns 400 when volumeId is missing', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/bookshelves/2/add' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when shelfId is not a number', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/bookshelves/notanumber/add?volumeId=abc' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 502 when the bookshelf service throws', async () => {
    const { addToShelf } = await import('../../services/bookshelf.js');
    vi.mocked(addToShelf).mockRejectedValueOnce(new Error('Google API error: 503'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/bookshelves/2/add?volumeId=abc123',
    });
    expect(res.statusCode).toBe(502);
  });
});

describe('POST /api/bookshelves/:shelfId/remove', () => {
  it('returns { ok: true } on success', async () => {
    const { removeFromShelf } = await import('../../services/bookshelf.js');
    vi.mocked(removeFromShelf).mockResolvedValueOnce(undefined);

    const res = await app.inject({
      method: 'POST',
      url: '/api/bookshelves/2/remove?volumeId=abc123',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('calls removeFromShelf with the correct shelfId and volumeId', async () => {
    const { removeFromShelf } = await import('../../services/bookshelf.js');
    const mock = vi.mocked(removeFromShelf);
    mock.mockResolvedValueOnce(undefined);

    await app.inject({ method: 'POST', url: '/api/bookshelves/4/remove?volumeId=xyz789' });
    expect(mock).toHaveBeenCalledWith(expect.any(String), 4, 'xyz789', expect.anything());
  });

  it('returns 400 when volumeId is missing', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/bookshelves/2/remove' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when shelfId is not a number', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookshelves/notanumber/remove?volumeId=abc',
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 502 when the bookshelf service throws', async () => {
    const { removeFromShelf } = await import('../../services/bookshelf.js');
    vi.mocked(removeFromShelf).mockRejectedValueOnce(new Error('Google API error: 503'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/bookshelves/2/remove?volumeId=abc123',
    });
    expect(res.statusCode).toBe(502);
  });
});
