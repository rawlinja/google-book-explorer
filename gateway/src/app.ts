import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { config } from './config/index.js';
import securityMiddleware from './middleware/security.js';
import sessionMiddleware from './middleware/session.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import meRouter from './routes/me.js';
import { proxyRouter } from './routes/proxy.js';

declare module 'express-session' {
  interface SessionData {
    user?: string;
    codeVerifier?: string;
    state?: string;
  }
}

export const app = express();

app.use(morgan('dev'));
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);
securityMiddleware.forEach((mw) => app.use(mw));

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/api/me', meRouter);
app.use(proxyRouter);
