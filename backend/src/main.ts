import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import securityMiddleware from './middleware/security.js';
import sessionMiddleware from './middleware/session.js';
import bookRouter from './routes/book.js';
import shopifyRouter from './routes/shopify.js';
import ragRouter from './routes/rag.js';
import meRouter from './routes/me.js';
import pool from './database/db.js';

// Extend session type to include 'user'
//import { SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: string;
  }
}

export const app = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://127.0.0.1:8080';

// Middleware
app.use(morgan('dev'));
app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(express.json());
app.use(sessionMiddleware);
// Centralized security middleware
securityMiddleware.forEach((mw) => app.use(mw));
// Routes
app.use('/api/books', bookRouter);
app.use('/api/shopify', shopifyRouter);
app.use('/api/rag', ragRouter);
app.use('/api/me', meRouter);

app.get('/test-session', async (req, res) => {
  req.session.user = 'demo';
  res.json({ ok: true, sessionId: req.sessionID });
});

app.get('/health/db', async (_req, res) => {
  const result = await pool.query('SELECT 1');
  res.json({ db: result.rows ? 'connected' : 'error' });
});
