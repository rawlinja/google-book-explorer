import { describe, it, expect, vi } from 'vitest';
import { buildApp } from '../../app.js';

const { fakeRedis } = vi.hoisted(() => ({
  fakeRedis: {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    on: vi.fn(),
    quit: vi.fn().mockResolvedValue('OK'),
  },
}));

vi.mock('../../lib/redis.js', () => ({ redis: fakeRedis }));

vi.mock('openid-client', async () => {
  const actual = await vi.importActual<typeof import('openid-client')>('openid-client');
  return { ...actual, discovery: vi.fn().mockResolvedValue({}) };
});

describe('Redis lifecycle', () => {
  it('logs Redis errors through the app logger', async () => {
    const app = await buildApp();

    expect(fakeRedis.on).toHaveBeenCalledWith('error', expect.any(Function));

    await app.close();
  });

  it('quits the shared client when the app closes', async () => {
    const app = await buildApp();
    await app.ready();

    await app.close();

    expect(fakeRedis.quit).toHaveBeenCalled();
  });
});
