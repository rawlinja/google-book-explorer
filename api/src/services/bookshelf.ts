import type { books_v1 } from '@googleapis/books';

const READ_ONLY_SHELF_IDS = new Set([1, 5, 6, 7, 8, 9]);

export interface Shelf {
  id: number;
  title: string;
  volumeCount: number;
}

type ShelfWithId = books_v1.Schema$Bookshelf & { id: number };

function isWritable(shelf: books_v1.Schema$Bookshelf): shelf is ShelfWithId {
  return typeof shelf.id === 'number' && !READ_ONLY_SHELF_IDS.has(shelf.id);
}

function toShelf(shelf: ShelfWithId): Shelf {
  return { id: shelf.id, title: shelf.title ?? '', volumeCount: shelf.volumeCount ?? 0 };
}

export async function getBookshelves(library: books_v1.Books): Promise<Shelf[]> {
  const { data } = await library.mylibrary.bookshelves.list();
  return (data.items ?? []).filter(isWritable).map(toShelf);
}

export async function addToShelf(
  library: books_v1.Books,
  shelfId: number,
  volumeId: string
): Promise<void> {
  await library.mylibrary.bookshelves.addVolume({ shelf: String(shelfId), volumeId });
}

export async function removeFromShelf(
  library: books_v1.Books,
  shelfId: number,
  volumeId: string
): Promise<void> {
  await library.mylibrary.bookshelves.removeVolume({ shelf: String(shelfId), volumeId });
}
