import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import securityMiddleware from './middleware/security.js';
import sessionMiddleware from './middleware/session.js';
import bookRouter from './routes/book.js';
import ragRouter from './routes/rag.js';
import meRouter from './routes/me.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import pool from './database/connection.js';

// Extend session type to include 'user'
//import { SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: string;
  }
}

export const app = express();

const corsOrigin = process.env.CORS_ORIGIN;

// Middleware
app.use(morgan('dev'));
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);
// Centralized security middleware
securityMiddleware.forEach((mw) => app.use(mw));
// Routes
app.use('/api/v2/books', bookRouter);
app.use('/api/rag', ragRouter);
app.use('/api/me', meRouter);
app.use('/health', healthRouter);
app.use('/auth', authRouter);
