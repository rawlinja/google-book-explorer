import { describe, it, expect, vi } from 'vitest';
import { RedisSessionStore } from '../../store/redisSessionStore.js';

describe('RedisSessionStore.get', () => {
  it('returns the parsed session when the key exists', () =>
    new Promise<void>((done) => {
      const redis = { get: vi.fn().mockResolvedValue(JSON.stringify({ userId: 1 })) };
      new RedisSessionStore(redis as any).get('abc', (err, session) => {
        expect(err).toBeNull();
        expect(session).toEqual({ userId: 1 });
        expect(redis.get).toHaveBeenCalledWith('sess:abc');
        done();
      });
    }));

  it('returns null when the key does not exist', () =>
    new Promise<void>((done) => {
      const redis = { get: vi.fn().mockResolvedValue(null) };
      new RedisSessionStore(redis as any).get('abc', (err, session) => {
        expect(err).toBeNull();
        expect(session).toBeNull();
        done();
      });
    }));

  it('forwards the Redis error to the callback', () =>
    new Promise<void>((done) => {
      const redisErr = new Error('connection lost');
      const redis = { get: vi.fn().mockRejectedValue(redisErr) };
      new RedisSessionStore(redis as any).get('abc', (err) => {
        expect(err).toBe(redisErr);
        done();
      });
    }));
});

describe('RedisSessionStore.set', () => {
  it('stores the session with TTL derived from cookie.maxAge', () =>
    new Promise<void>((done) => {
      const redis = { setex: vi.fn().mockResolvedValue('OK') };
      const session = { cookie: { maxAge: 3_600_000 } };
      new RedisSessionStore(redis as any).set('abc', session, (err) => {
        expect(err).toBeUndefined();
        expect(redis.setex).toHaveBeenCalledWith('sess:abc', 3600, JSON.stringify(session));
        done();
      });
    }));

  it('defaults TTL to 3600 when cookie.maxAge is absent', () =>
    new Promise<void>((done) => {
      const redis = { setex: vi.fn().mockResolvedValue('OK') };
      const session = {};
      new RedisSessionStore(redis as any).set('abc', session, () => {
        expect(redis.setex).toHaveBeenCalledWith('sess:abc', 3600, JSON.stringify(session));
        done();
      });
    }));

  it('forwards the Redis error to the callback', () =>
    new Promise<void>((done) => {
      const redisErr = new Error('connection lost');
      const redis = { setex: vi.fn().mockRejectedValue(redisErr) };
      new RedisSessionStore(redis as any).set('abc', {}, (err) => {
        expect(err).toBe(redisErr);
        done();
      });
    }));
});

describe('RedisSessionStore.destroy', () => {
  it('deletes the session key', () =>
    new Promise<void>((done) => {
      const redis = { del: vi.fn().mockResolvedValue(1) };
      new RedisSessionStore(redis as any).destroy('abc', (err) => {
        expect(err).toBeUndefined();
        expect(redis.del).toHaveBeenCalledWith('sess:abc');
        done();
      });
    }));

  it('forwards the Redis error to the callback', () =>
    new Promise<void>((done) => {
      const redisErr = new Error('connection lost');
      const redis = { del: vi.fn().mockRejectedValue(redisErr) };
      new RedisSessionStore(redis as any).destroy('abc', (err) => {
        expect(err).toBe(redisErr);
        done();
      });
    }));
});
