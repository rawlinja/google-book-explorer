import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

interface JwtPayload {
  sessionId: string;
  iat: number;
  exp: number;
}

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const token = req.cookies?.jwt_token;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    return res.status(200).json({
      isLoggedIn: true,
      expiresAt: decoded.exp * 1000,
    });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
