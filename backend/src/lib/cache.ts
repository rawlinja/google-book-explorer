import { createClient } from 'redis';

export const redis = createClient({
  url: process.env.REDIS_URL,
});

export async function getContext(sessionId: string): Promise<string[] | null> {
  if (redis.isOpen === false) {
    await redis.connect();
  }

  const key = `ctx:${sessionId}`;
  const data = await redis.lRange(key, 0, -1);
  return data as string[] | null;
}

export async function setContext(sessionId: string, chunks: string[], ttl = 3600) {
  if (!redis.isOpen) {
    await redis.connect();
  }
  const key = `ctx:${sessionId}`;
  await redis.del(key); // overwrite stale context
  if (chunks.length) {
    await redis.rpush(key, ...chunks);
    await redis.expire(key, ttl);
  }
  return key;
}
