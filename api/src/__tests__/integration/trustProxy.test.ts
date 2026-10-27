import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../../app.js';

vi.mock('../../lib/redis.js', () => {
  const store: Record<string, string> = {};
  return {
    redis: {
      get: (k: string) => Promise.resolve(store[k] ?? null),
      setex: (k: string, _ttl: number, v: string) => {
        store[k] = v;
        return Promise.resolve('OK');
      },
      del: (k: string) => {
        delete store[k];
        return Promise.resolve(1);
      },
      on: () => {},
      quit: () => Promise.resolve(),
    },
  };
});

const app = await buildApp();
app.get('/__test/ip', async (req) => ({ ip: req.ip }));

beforeAll(() => app.ready());
afterAll(() => app.close());

const FORGED_IP = '1.2.3.4';
const CLIENT_IP = '203.0.113.7';
const UNTRUSTED_PEER_IP = '198.51.100.9';

describe('client IP behind nginx', () => {
  it('uses the address nginx appended, not a client-supplied X-Forwarded-For', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/__test/ip',
      headers: { 'x-forwarded-for': `${FORGED_IP}, ${CLIENT_IP}` },
    });

    expect(res.json()).toEqual({ ip: CLIENT_IP });
  });

  it('uses the forwarded address when nginx is the only hop', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/__test/ip',
      headers: { 'x-forwarded-for': CLIENT_IP },
    });

    expect(res.json()).toEqual({ ip: CLIENT_IP });
  });

  it('ignores X-Forwarded-For from a peer that is not a private-network proxy', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/__test/ip',
      remoteAddress: UNTRUSTED_PEER_IP,
      headers: { 'x-forwarded-for': FORGED_IP },
    });

    expect(res.json()).toEqual({ ip: UNTRUSTED_PEER_IP });
  });
});
