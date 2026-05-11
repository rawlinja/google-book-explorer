import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Proxy auth guard', () => {
  it('returns 401 for /api/books without JWT cookie', async () => {
    const res = await request(app).get('/api/books/search?q=typescript');
    expect(res.status).toBe(401);
  });

  it('returns 401 for /api/rag/generate without JWT cookie', async () => {
    const res = await request(app)
      .post('/api/rag/generate')
      .send({ q: 'test', sessionId: 'abc' });
    expect(res.status).toBe(401);
  });
});
