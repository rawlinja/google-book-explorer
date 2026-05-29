import type { Redis } from 'ioredis';
import { authorizedFetch } from '../lib/googleAuth.js';

const BOOKSHELVES_URL = 'https://www.googleapis.com/books/v1/mylibrary/bookshelves';

const READ_ONLY_SHELF_IDS = new Set([1, 5, 6, 7, 8, 9]);

export interface Shelf {
  id: number;
  title: string;
  volumeCount: number;
}

export async function getBookshelves(sessionId: string, redis: Redis): Promise<Shelf[]> {
  const res = await authorizedFetch(BOOKSHELVES_URL, {}, sessionId, redis);
  if (!res.ok) throw new Error(`Google Bookshelf API error: ${res.status}`);

  const data = (await res.json()) as { items?: any[] };
  return (data.items ?? [])
    .filter((item: any) => !READ_ONLY_SHELF_IDS.has(item.id as number))
    .map((item: any) => ({
      id: item.id as number,
      title: item.title as string,
      volumeCount: (item.volumeCount as number) ?? 0,
    }));
}

export async function addToShelf(
  sessionId: string,
  shelfId: number,
  volumeId: string,
  redis: Redis
): Promise<void> {
  const url = new URL(`${BOOKSHELVES_URL}/${shelfId}/addVolume`);
  url.searchParams.set('volumeId', volumeId);

  const res = await authorizedFetch(url.toString(), { method: 'POST' }, sessionId, redis);
  if (!res.ok) throw new Error(`Google Bookshelf API error: ${res.status}`);
}

export async function removeFromShelf(
  sessionId: string,
  shelfId: number,
  volumeId: string,
  redis: Redis
): Promise<void> {
  const url = new URL(`${BOOKSHELVES_URL}/${shelfId}/removeVolume`);
  url.searchParams.set('volumeId', volumeId);

  const res = await authorizedFetch(url.toString(), { method: 'POST' }, sessionId, redis);
  if (!res.ok) throw new Error(`Google Bookshelf API error: ${res.status}`);
}
