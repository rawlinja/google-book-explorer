import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SESSION_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  REDIS_URL: z.string().default('redis://redis:6379'),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().min(1),
  BACKEND_URL: z.string().default('http://backend:3002'),
});

export const config = schema.parse(process.env);
