import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/index.js';

export const proxyRouter = Router();

const backendProxy = createProxyMiddleware({
  target: config.BACKEND_URL,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.path = proxyReq.path.replace(/^\/api/, '');
    },
  },
});

proxyRouter.use('/api/books', requireAuth, backendProxy);
proxyRouter.use('/api/rag', requireAuth, backendProxy);
