import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';

const { fakeRedis } = vi.hoisted(() => ({
  fakeRedis: { on: vi.fn(), quit: vi.fn() },
}));

vi.mock('../../lib/redis.js', () => ({ redis: fakeRedis }));

const { default: redisPlugin } = await import('../../plugins/redis.js');

beforeEach(() => {
  vi.clearAllMocks();
  fakeRedis.quit.mockResolvedValue('OK');
});

async function startApp() {
  const app = Fastify();
  await app.register(redisPlugin);
  await app.ready();
  return app;
}

describe('redis plugin', () => {
  it('decorates Fastify with the shared Redis client', async () => {
    const app = await startApp();
    expect(app.redis).toBe(fakeRedis);
    await app.close();
  });

  it('quits the shared client when Fastify closes', async () => {
    const app = await startApp();
    await app.close();
    expect(fakeRedis.quit).toHaveBeenCalledOnce();
  });
});
