import { describe, it, expect, vi, beforeEach } from 'vitest';

const { volumesList, booksFactory } = vi.hoisted(() => {
  const volumesList = vi.fn();
  return {
    volumesList,
    booksFactory: vi.fn(() => ({ volumes: { list: volumesList } })),
  };
});

vi.mock('@googleapis/books', () => ({ books: booksFactory }));

const {
  searchByTitle,
  searchByAuthor,
  searchByIsbn,
  searchBySubject,
  searchByPublisher,
  searchByLccn,
} = await import('../../services/googleBooks.js');

beforeEach(() => {
  volumesList.mockReset();
  volumesList.mockResolvedValue({ data: { totalItems: 1, items: [] } });
});

function listParams() {
  return volumesList.mock.calls[0][0];
}

describe('client', () => {
  it('creates a Books v1 client authenticated with the API key', () => {
    expect(booksFactory).toHaveBeenCalledWith({ version: 'v1', auth: 'test-books-key' });
  });
});

describe('response parsing', () => {
  it('maps Google Books API response fields to BookItem', async () => {
    volumesList.mockResolvedValueOnce({
      data: {
        totalItems: 1,
        items: [
          {
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
          },
        ],
      },
    });

    const result = await searchByTitle('Clean Code', 0);

    expect(result.totalItems).toBe(1);
    expect(result.items[0]).toEqual({
      id: 'vol1',
      title: 'Clean Code',
      authors: ['Robert C. Martin'],
      categories: ['Programming'],
      thumbnail: 'https://books.google.com/thumbnail.jpg',
      publishedDate: '2008-08-01',
      description: 'A handbook of agile software craftsmanship.',
      pageCount: 431,
      infoLink: 'https://books.google.com/books?id=vol1',
    });
  });

  it('upgrades thumbnail URL from http to https', async () => {
    volumesList.mockResolvedValueOnce({
      data: {
        totalItems: 1,
        items: [
          {
            id: 'vol2',
            volumeInfo: {
              title: 'Test',
              imageLinks: { thumbnail: 'http://books.google.com/image.jpg' },
            },
          },
        ],
      },
    });

    const result = await searchByTitle('Test', 0);
    expect(result.items[0].thumbnail).toBe('https://books.google.com/image.jpg');
  });

  it('falls back to smallThumbnail when thumbnail is absent', async () => {
    volumesList.mockResolvedValueOnce({
      data: {
        totalItems: 1,
        items: [
          {
            id: 'vol4',
            volumeInfo: {
              title: 'Small Cover',
              imageLinks: { smallThumbnail: 'http://books.google.com/small.jpg' },
            },
          },
        ],
      },
    });

    const result = await searchByTitle('Small Cover', 0);
    expect(result.items[0].thumbnail).toBe('https://books.google.com/small.jpg');
  });

  it('handles missing optional fields gracefully', async () => {
    volumesList.mockResolvedValueOnce({
      data: { totalItems: 1, items: [{ id: 'vol3', volumeInfo: { title: 'Minimal' } }] },
    });

    const result = await searchByTitle('Minimal', 0);
    expect(result.items[0]).toEqual({ id: 'vol3', title: 'Minimal', authors: [], categories: [] });
  });

  it('returns no items when the response has no items or totalItems', async () => {
    volumesList.mockResolvedValueOnce({ data: {} });

    const result = await searchByTitle('Nothing', 0);
    expect(result).toEqual({ items: [], totalItems: 0 });
  });

  it('propagates errors from the Google Books client', async () => {
    const sdkError = Object.assign(new Error('Service temporarily unavailable.'), { status: 503 });
    volumesList.mockRejectedValueOnce(sdkError);

    await expect(searchByTitle('anything', 0)).rejects.toBe(sdkError);
  });
});

describe('request parameters', () => {
  it('requests 10 results from the given startIndex', async () => {
    await searchByTitle('Refactoring', 20);
    expect(listParams()).toEqual({ q: 'intitle:Refactoring', maxResults: 10, startIndex: 20 });
  });

  it.each([
    ['searchByTitle', searchByTitle, 'Clean Code', 'intitle:Clean Code'],
    ['searchByAuthor', searchByAuthor, 'Martin Fowler', 'inauthor:Martin Fowler'],
    ['searchByIsbn', searchByIsbn, '9780132350884', 'isbn:9780132350884'],
    ['searchBySubject', searchBySubject, 'Software', 'subject:Software'],
    ['searchByPublisher', searchByPublisher, "O'Reilly", "inpublisher:O'Reilly"],
    ['searchByLccn', searchByLccn, '2008024750', 'lccn:2008024750'],
  ])('%s queries with the matching qualifier', async (_name, searchFn, term, expectedQ) => {
    await searchFn(term, 0);
    expect(listParams().q).toBe(expectedQ);
  });
});
