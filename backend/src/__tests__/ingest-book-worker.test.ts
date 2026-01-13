import request from 'supertest';
import { app } from '../app.js';
import { expect, test } from 'vitest';

test('POST /api/rag/search should retrieve inserted chunk', async () => {
  // First we insert a chunk row using SQL API so we can retrieve it
  await request(app)
    .post('/api/rag/ingest/book')
    .send({
      volumeId: 'hyp-17',
      title: 'Hyperion',
      description: 'Sci-fi classic by Dan Simmons',
      text: 'Dan Simmons wrote Hyperion',
      metadata: { source: 'test' },
    });

  // Now search for it
  const res = await request(app).post('/api/rag/search').send({
    q: 'Dan Simmons wrote Hyperion',
    sessionId: 'abc123',
  });

  expect(res.body.ok).toBe(true);
  expect(res.body.context.length).toBeGreaterThan(0); // must return ✅
  expect(res.body.context[0]).toContain('Simmons'); // grounding proof
});
