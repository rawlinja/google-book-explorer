import type { Redis } from 'ioredis';
import { SESSION_TTL_SECONDS } from '../lib/session.js';

export class RedisSessionStore {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  get(sid: string, cb: (err: any, session?: any) => void) {
    this.redis
      .get(`sess:${sid}`)
      .then((data) => cb(null, data ? JSON.parse(data) : null))
      .catch(cb);
  }

  set(sid: string, session: any, cb: (err?: any) => void) {
    const ttl = session?.cookie?.maxAge
      ? Math.floor(session.cookie.maxAge / 1000)
      : SESSION_TTL_SECONDS;
    this.redis
      .setex(`sess:${sid}`, ttl, JSON.stringify(session))
      .then(() => cb())
      .catch(cb);
  }

  destroy(sid: string, cb: (err?: any) => void) {
    this.redis
      .del(`sess:${sid}`)
      .then(() => cb())
      .catch(cb);
  }
}
