import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { books_v1 } from '@googleapis/books';
import { getBookshelves, addToShelf, removeFromShelf } from '../../services/bookshelf.js';

const shelvesApi = { list: vi.fn(), addVolume: vi.fn(), removeVolume: vi.fn() };
const library = { mylibrary: { bookshelves: shelvesApi } } as unknown as books_v1.Books;

beforeEach(() => {
  vi.resetAllMocks();
  shelvesApi.addVolume.mockResolvedValue({ data: {} });
  shelvesApi.removeVolume.mockResolvedValue({ data: {} });
});

describe('getBookshelves', () => {
  it('excludes read-only shelves', async () => {
    shelvesApi.list.mockResolvedValueOnce({
      data: {
        items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({
          id,
          title: `Shelf ${id}`,
          volumeCount: 1,
        })),
      },
    });

    const shelves = await getBookshelves(library);

    expect(shelves.map((s) => s.id)).toEqual([2, 3, 4]);
  });

  it('maps shelves and defaults a missing volume count to 0', async () => {
    shelvesApi.list.mockResolvedValueOnce({ data: { items: [{ id: 2, title: 'To Read' }] } });

    expect(await getBookshelves(library)).toEqual([{ id: 2, title: 'To Read', volumeCount: 0 }]);
  });

  it('skips shelves without an id', async () => {
    shelvesApi.list.mockResolvedValueOnce({ data: { items: [{ title: 'No id' }] } });

    expect(await getBookshelves(library)).toEqual([]);
  });

  it('returns an empty list when Google returns no items', async () => {
    shelvesApi.list.mockResolvedValueOnce({ data: {} });

    expect(await getBookshelves(library)).toEqual([]);
  });

  it('propagates SDK errors', async () => {
    shelvesApi.list.mockRejectedValueOnce(new Error('backendFailed'));

    await expect(getBookshelves(library)).rejects.toThrow('backendFailed');
  });
});

describe('addToShelf', () => {
  it('calls addVolume with the shelf id as a string', async () => {
    await addToShelf(library, 2, 'vol123');

    expect(shelvesApi.addVolume).toHaveBeenCalledWith({ shelf: '2', volumeId: 'vol123' });
  });

  it('propagates SDK errors', async () => {
    shelvesApi.addVolume.mockRejectedValueOnce(new Error('invalid'));

    await expect(addToShelf(library, 2, 'vol123')).rejects.toThrow('invalid');
  });
});

describe('removeFromShelf', () => {
  it('calls removeVolume with the shelf id as a string', async () => {
    await removeFromShelf(library, 2, 'vol123');

    expect(shelvesApi.removeVolume).toHaveBeenCalledWith({ shelf: '2', volumeId: 'vol123' });
  });

  it('propagates SDK errors', async () => {
    shelvesApi.removeVolume.mockRejectedValueOnce(new Error('invalid'));

    await expect(removeFromShelf(library, 2, 'vol123')).rejects.toThrow('invalid');
  });
});
