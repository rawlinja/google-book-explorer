import type { FastifyBaseLogger } from 'fastify';
import { books, type books_v1 } from '@googleapis/books';
import type { Credentials } from 'google-auth-library';
import { createOAuthClient } from './googleOAuth.js';
import { redis } from './redis.js';

export interface StoredTokens {
  access_token: string;
  refresh_token: string | null;
  expiry_date: number | null;
}

function tokenKey(sessionId: string): string {
  return `tokens:${sessionId}`;
}

export async function getTokens(sessionId: string): Promise<StoredTokens> {
  const raw = await redis.get(tokenKey(sessionId));
  if (!raw) throw new Error('No tokens found for session');
  return JSON.parse(raw) as StoredTokens;
}

export async function saveTokens(
  sessionId: string,
  tokens: StoredTokens,
  ttlSeconds: number
): Promise<void> {
  await redis.setex(tokenKey(sessionId), ttlSeconds, JSON.stringify(tokens));
}

// KEEPTTL: a refresh must not extend the tokens past the session's expiry.
export async function updateTokens(sessionId: string, tokens: StoredTokens): Promise<void> {
  await redis.set(tokenKey(sessionId), JSON.stringify(tokens), 'KEEPTTL');
}

function mergeRefreshed(stored: StoredTokens, refreshed: Credentials): StoredTokens {
  return {
    access_token: refreshed.access_token ?? stored.access_token,
    refresh_token: refreshed.refresh_token ?? stored.refresh_token,
    expiry_date: refreshed.expiry_date ?? stored.expiry_date,
  };
}

export async function createUserClient(
  sessionId: string,
  log: FastifyBaseLogger
): Promise<books_v1.Books> {
  const stored = await getTokens(sessionId);
  const client = createOAuthClient();
  client.setCredentials(stored);

  client.on('tokens', (refreshed) => {
    updateTokens(sessionId, mergeRefreshed(stored, refreshed)).catch((err) =>
      log.error({ err }, 'auth.tokens.save_failed')
    );
  });

  return books({ version: 'v1', auth: client });
}
