import request from 'supertest';
import { app } from '../main.js';

// Vitest supports describe/it/expect as globals

describe('Health Check', () => {
  it('should return 200 for /health/db', async () => {
    const res = await request(app).get('/health/db');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('db', 'connected');
  });
});
