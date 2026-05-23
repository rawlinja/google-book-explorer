import type { Redis } from 'ioredis';
import * as openidClient from 'openid-client';
import { oidcConfig } from '../lib/oidc.js';

const TOKEN_TTL = 3600;

const BOOKSHELVES_URL = 'https://www.googleapis.com/books/v1/mylibrary/bookshelves';

// Shelves Google auto-populates — users cannot manually add volumes to these
const READ_ONLY_SHELF_IDS = new Set([1, 5, 6, 7, 8, 9]);

export interface Shelf {
  id: number;
  title: string;
  volumeCount: number;
}

interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | undefined;
}

async function getTokens(sessionId: string, redis: Redis): Promise<StoredTokens> {
  const raw = await redis.get(`tokens:${sessionId}`);
  if (!raw) throw new Error('No tokens found for session');
  return JSON.parse(raw) as StoredTokens;
}

async function refreshAndSave(
  sessionId: string,
  stored: StoredTokens,
  redis: Redis
): Promise<StoredTokens> {
  if (!stored.refreshToken) throw new Error('No refresh token available');

  const refreshed = await openidClient.refreshTokenGrant(oidcConfig, stored.refreshToken);

  const updated: StoredTokens = {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? stored.refreshToken,
    idToken: refreshed.id_token,
  };

  await redis.setex(`tokens:${sessionId}`, TOKEN_TTL, JSON.stringify(updated));
  return updated;
}

async function authorizedFetch(
  url: string,
  init: RequestInit,
  sessionId: string,
  redis: Redis
): Promise<Response> {
  const tokens = await getTokens(sessionId, redis);

  const res = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${tokens.accessToken}` },
  });

  if (res.status !== 401) return res;

  const refreshed = await refreshAndSave(sessionId, tokens, redis);
  return fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${refreshed.accessToken}` },
  });
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
