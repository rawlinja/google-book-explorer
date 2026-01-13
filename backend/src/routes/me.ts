import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

interface JwtPayload {
  accessId: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
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
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    return res.status(200).json({
      isLoggedIn: true,
      expiresAt: decoded.exp * 1000,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
});

export default router;
