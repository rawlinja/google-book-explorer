import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import sessionStore from '../services/sessionStore.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

router.get('/api/me', async (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies.jwt_token) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  const accessId = cookies.access_id;
  const cachedData = await sessionStore.get(accessId);
  // Optionally check cachedData for session validity
  try {
    const decoded = jwt.verify(cookies.jwt_token, JWT_SECRET);
    return res.status(200).json({ isLoggedIn: true });
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
  }
});

export default router;
