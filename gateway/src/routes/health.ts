import { Router, Request, Response } from 'express';
import pool from '../database/connection.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.get('/db', async (_req: Request, res: Response) => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT 1');
    const duration = Date.now() - start;
    res.json({ db: result.rows ? 'connected' : 'error', responseTimeMs: duration });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'database',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database connection failed',
      database: {
        connected: false,
      },
    });
  }
});

router.get('/session', (req: Request, res: Response) => {
  if (req.session.user) {
    res.json({ session: 'active', user: req.session.user });
  } else {
    res.status(401).json({ session: 'inactive' });
  }
});

export default router;
