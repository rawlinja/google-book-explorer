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

describe('response parsing', () => {
  it('maps Google Books API response fields to BookItem', async () => {
    const apiResponse = {
      totalItems: 1,
      items: [{
        id: 'vol1',
        volumeInfo: {
          title: 'Clean Code',
          authors: ['Robert C. Martin'],
          categories: ['Programming'],
          publishedDate: '2008-08-01',
          description: 'A handbook of agile software craftsmanship.',
          pageCount: 431,
          imageLinks: { thumbnail: 'http://books.google.com/thumbnail.jpg' },
          infoLink: 'https://books.google.com/books?id=vol1',
        },
      }],
    };

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(apiResponse), { status: 200 })
    );

    const { searchByTitle } = await import('../../services/googleBooks.js');
    const result = await searchByTitle('Clean Code', 0);

    expect(result.totalItems).toBe(1);
    const book = result.items[0];
    expect(book.id).toBe('vol1');
    expect(book.title).toBe('Clean Code');
    expect(book.authors).toEqual(['Robert C. Martin']);
    expect(book.categories).toEqual(['Programming']);
    expect(book.thumbnail).toBe('https://books.google.com/thumbnail.jpg');
    expect(book.pageCount).toBe(431);
  });

  it('upgrades thumbnail URL from http to https', async () => {
    const apiResponse = {
      totalItems: 1,
      items: [{
        id: 'vol2',
        volumeInfo: {
          title: 'Test',
          authors: [],
          categories: [],
          imageLinks: { thumbnail: 'http://books.google.com/image.jpg' },
        },
      }],
    };

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(apiResponse), { status: 200 })
    );

    const { searchByTitle } = await import('../../services/googleBooks.js');
    const result = await searchByTitle('Test', 0);
    expect(result.items[0].thumbnail).toBe('https://books.google.com/image.jpg');
  });

  it('handles missing optional fields gracefully', async () => {
    const apiResponse = {
      totalItems: 1,
      items: [{ id: 'vol3', volumeInfo: { title: 'Minimal' } }],
    };

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(apiResponse), { status: 200 })
    );

    const { searchByTitle } = await import('../../services/googleBooks.js');
    const result = await searchByTitle('Minimal', 0);
    const book = result.items[0];
    expect(book.title).toBe('Minimal');
    expect(book.authors).toEqual([]);
    expect(book.categories).toEqual([]);
    expect(book.thumbnail).toBeUndefined();
  });
});

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
