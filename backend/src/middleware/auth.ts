import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.jwt_token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET!);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
  }
}

export function requireSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
}
