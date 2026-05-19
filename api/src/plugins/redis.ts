import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';
import { config } from '../config/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const redis = new Redis(config.REDIS_URL);

  redis.on('error', (err) => fastify.log.error({ err }, 'Redis error'));

  fastify.decorate('redis', redis);
  fastify.addHook('onClose', async () => redis.quit());
});
