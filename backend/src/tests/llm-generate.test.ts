import request from 'supertest';
import { app } from '../main.js';

describe('LLM Generate Endpoint', () => {
  it('should return a grounded answer for a valid query', async () => {
    const response = await request(app)
      .post('/api/llm-generate')
      .send({ query: 'Summarize the book context.' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('answer');
    expect(typeof response.body.answer).toBe('string');
  });
});
