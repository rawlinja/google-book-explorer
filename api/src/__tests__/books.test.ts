import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../app.js';

vi.mock('../hooks/requireAuth.js', () => ({
  requireAuth: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/bookSearch.js', () => ({
  searchBooks: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
}));

vi.mock('../plugins/redis.js', async () => {
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

const MOCK_BOOKS = {
  items: [{ id: 'abc123', title: 'Clean Code', authors: ['Robert C. Martin'], categories: [] }],
  totalItems: 87,
};

const app = await buildApp();

beforeAll(() => app.ready());
afterAll(() => app.close());

describe('GET /api/books/search', () => {
  it('returns 400 when q is missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/books/search' });
    expect(res.statusCode).toBe(400);
  });

  it('returns books and totalItems', async () => {
    const { searchBooks } = await import('../services/bookSearch.js');
    vi.mocked(searchBooks).mockResolvedValueOnce(MOCK_BOOKS);

    const res = await app.inject({ method: 'GET', url: '/api/books/search?q=clean+code' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totalItems).toBe(87);
    expect(body.items[0].title).toBe('Clean Code');
  });

  it('passes startIndex 10 for page 2', async () => {
    const { searchBooks } = await import('../services/bookSearch.js');
    const mock = vi.mocked(searchBooks);
    mock.mockResolvedValueOnce(MOCK_BOOKS);

    await app.inject({ method: 'GET', url: '/api/books/search?q=python&page=2' });
    expect(mock).toHaveBeenCalledWith('python', 10);
  });
});
