import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.jwt_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  try {
    jwt.verify(token, config.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
  }
}

