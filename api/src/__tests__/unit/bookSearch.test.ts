import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('openai', () => ({
  default: class {
    responses = { create: mockCreate };
  },
}));

vi.mock('../../services/googleBooks.js', () => ({
  searchByTitle: vi.fn(),
  searchByAuthor: vi.fn(),
  searchByIsbn: vi.fn(),
}));

const MOCK_RESULT = {
  items: [{ id: 'abc', title: 'Clean Code', authors: ['Robert C. Martin'], categories: [] }],
  totalItems: 42,
};

function makeFunctionCall(name: string, args: Record<string, string>) {
  return { type: 'function_call', name, arguments: JSON.stringify(args) };
}

beforeEach(() => vi.clearAllMocks());

describe('searchBooks', () => {
  it('throws when the model returns malformed JSON in tool call arguments', async () => {
    mockCreate.mockResolvedValueOnce({
      output: [{ type: 'function_call', name: 'get_books_by_title', arguments: '{not: valid json}' }],
    });

    const { searchBooks } = await import('../../services/bookSearch.js');
    await expect(searchBooks('clean code', 0)).rejects.toThrow(SyntaxError);
  });

  it('returns empty result when the model calls no tools', async () => {
    mockCreate.mockResolvedValueOnce({ output: [] });

    const { searchBooks } = await import('../../services/bookSearch.js');
    const result = await searchBooks('something', 0);
    expect(result).toEqual({ items: [], totalItems: 0 });
  });

  it('calls searchByTitle when the model selects get_books_by_title', async () => {
    mockCreate.mockResolvedValueOnce({
      output: [makeFunctionCall('get_books_by_title', { title: 'Clean Code' })],
    });

    const { searchByTitle } = await import('../../services/googleBooks.js');
    vi.mocked(searchByTitle).mockResolvedValueOnce(MOCK_RESULT);

    const { searchBooks } = await import('../../services/bookSearch.js');
    const result = await searchBooks('Clean Code', 0);

    expect(searchByTitle).toHaveBeenCalledWith('Clean Code', 0);
    expect(result.totalItems).toBe(42);
  });

  it('calls searchByAuthor when the model selects get_books_by_author', async () => {
    mockCreate.mockResolvedValueOnce({
      output: [makeFunctionCall('get_books_by_author', { author: 'Martin Fowler' })],
    });

    const { searchByAuthor } = await import('../../services/googleBooks.js');
    vi.mocked(searchByAuthor).mockResolvedValueOnce(MOCK_RESULT);

    const { searchBooks } = await import('../../services/bookSearch.js');
    await searchBooks('books by Martin Fowler', 0);

    expect(searchByAuthor).toHaveBeenCalledWith('Martin Fowler', 0);
  });

  it('calls searchByIsbn when the model selects get_books_by_isbn', async () => {
    mockCreate.mockResolvedValueOnce({
      output: [makeFunctionCall('get_books_by_isbn', { isbn: '9780132350884' })],
    });

    const { searchByIsbn } = await import('../../services/googleBooks.js');
    vi.mocked(searchByIsbn).mockResolvedValueOnce(MOCK_RESULT);

    const { searchBooks } = await import('../../services/bookSearch.js');
    await searchBooks('9780132350884', 0);

    expect(searchByIsbn).toHaveBeenCalledWith('9780132350884', 0);
  });

  it('passes startIndex through to the search function', async () => {
    mockCreate.mockResolvedValueOnce({
      output: [makeFunctionCall('get_books_by_title', { title: 'Refactoring' })],
    });

    const { searchByTitle } = await import('../../services/googleBooks.js');
    vi.mocked(searchByTitle).mockResolvedValueOnce(MOCK_RESULT);

    const { searchBooks } = await import('../../services/bookSearch.js');
    await searchBooks('Refactoring', 20);

    expect(searchByTitle).toHaveBeenCalledWith('Refactoring', 20);
  });
});
