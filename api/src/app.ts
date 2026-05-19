import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { Redis } from 'ioredis';
import redisPlugin from './plugins/redis.js';
import { config } from './config/index.js';
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import meRoutes from './routes/me.js';
import booksRoutes from './routes/books.js';

class RedisSessionStore {
  constructor(private redis: Redis) {}

  get(sid: string, cb: (err: any, session?: any) => void) {
    this.redis
      .get(`sess:${sid}`)
      .then((data) => cb(null, data ? JSON.parse(data) : null))
      .catch(cb);
  }

  set(sid: string, session: any, cb: (err?: any) => void) {
    const ttl = session?.cookie?.maxAge ? Math.floor(session.cookie.maxAge / 1000) : 3600;
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

export async function buildApp() {
  const fastify = Fastify({
    logger: { level: config.NODE_ENV === 'test' ? 'silent' : 'info' },
    trustProxy: true,
  });

  await fastify.register(helmet);
  await fastify.register(cors, { origin: config.CORS_ORIGIN, credentials: true });
  await fastify.register(cookie);
  await fastify.register(redisPlugin);
  await fastify.register(session, {
    secret: config.SESSION_SECRET,
    cookie: {
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000,
    },
    store: new RedisSessionStore(fastify.redis),
  });
  await fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(meRoutes);
  await fastify.register(booksRoutes);

  return fastify;
}
