import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ totalItems: 1, items: [] }), { status: 200 })
  ));
});

function getQueryParam(call: unknown): string {
  const url = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
  return url.searchParams.get('q') ?? '';
}

describe('searchByTitle', () => {
  it('queries Google Books with intitle: qualifier', async () => {
    const { searchByTitle } = await import('../../services/googleBooks.js');
    await searchByTitle('Clean Code', 0);
    expect(getQueryParam(null)).toBe('intitle:Clean Code');
  });

  it('passes startIndex in the request URL', async () => {
    const { searchByTitle } = await import('../../services/googleBooks.js');
    await searchByTitle('Refactoring', 20);
    const url = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(url.searchParams.get('startIndex')).toBe('20');
  });
});

describe('searchByAuthor', () => {
  it('queries Google Books with inauthor: qualifier', async () => {
    const { searchByAuthor } = await import('../../services/googleBooks.js');
    await searchByAuthor('Martin Fowler', 0);
    expect(getQueryParam(null)).toBe('inauthor:Martin Fowler');
  });
});

describe('searchByIsbn', () => {
  it('queries Google Books with isbn: qualifier', async () => {
    const { searchByIsbn } = await import('../../services/googleBooks.js');
    await searchByIsbn('9780132350884', 0);
    expect(getQueryParam(null)).toBe('isbn:9780132350884');
  });
});
