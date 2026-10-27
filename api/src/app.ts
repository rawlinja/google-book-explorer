import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { RedisSessionStore } from './store/redisSessionStore.js';
import { config } from './config/index.js';
import { redis } from './lib/redis.js';
import { SESSION_TTL_SECONDS } from './lib/session.js';
import { loggerOptions } from './lib/logger.js';
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import meRoutes from './routes/me.js';
import booksRoutes from './routes/books.js';
import bookshelvesRoutes from './routes/bookshelves.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: loggerOptions(config.NODE_ENV),
    trustProxy: 'loopback, linklocal, uniquelocal',
  });

  redis.on('error', (err) => fastify.log.error({ err }, 'Redis error'));
  fastify.addHook('onClose', async () => redis.quit());

  await fastify.register(helmet);
  await fastify.register(cors, { origin: config.CORS_ORIGIN, credentials: true });
  await fastify.register(cookie);
  await fastify.register(session, {
    secret: config.SESSION_SECRET,
    cookie: {
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS * 1000,
    },
    store: new RedisSessionStore(redis),
  });
  await fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(meRoutes);
  await fastify.register(booksRoutes);
  await fastify.register(bookshelvesRoutes);

  return fastify;
}
