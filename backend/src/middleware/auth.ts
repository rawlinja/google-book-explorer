import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import sessionStore from '../services/sessionStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.jwt_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
  }
}

export async function requireSession(req: Request, res: Response, next: NextFunction) {
  const accessId = req.cookies.access_id;
  if (!accessId) return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  const session = await sessionStore.get(accessId);
  if (!session) return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
  req.session = session;
  next();
}
