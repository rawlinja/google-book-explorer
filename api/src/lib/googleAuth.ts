import type { Redis } from 'ioredis';
import * as openidClient from 'openid-client';
import { oidcConfig } from './oidc.js';

const TOKEN_TTL = 3600;

export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | undefined;
}

export async function getTokens(sessionId: string, redis: Redis): Promise<StoredTokens> {
  const raw = await redis.get(`tokens:${sessionId}`);
  if (!raw) throw new Error('No tokens found for session');
  return JSON.parse(raw) as StoredTokens;
}

export async function refreshAndSave(
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

export async function authorizedFetch(
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
