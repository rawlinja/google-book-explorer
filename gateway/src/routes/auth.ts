import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import * as openidClient from 'openid-client';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { redisClient } from '../lib/redis.js';

const oidcConfig = await openidClient.discovery(
  new URL('https://accounts.google.com'),
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET
);

const TOKEN_TTL = 3600; // seconds — matches JWT expiry

const router = Router();

router.get('/google', async (req: Request, res: Response) => {
  const codeVerifier = openidClient.randomPKCECodeVerifier();
  const codeChallenge = await openidClient.calculatePKCECodeChallenge(codeVerifier);
  const state = openidClient.randomState();

  req.session!.codeVerifier = codeVerifier;
  req.session!.state = state;

  const url = openidClient.buildAuthorizationUrl(oidcConfig, {
    redirect_uri: config.GOOGLE_REDIRECT_URI,
    scope: 'openid email profile https://www.googleapis.com/auth/books',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });

  res.redirect(url.href);
});

router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const currentUrl = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);

    const tokens = await openidClient.authorizationCodeGrant(oidcConfig, currentUrl, {
      pkceCodeVerifier: req.session!.codeVerifier,
      expectedState: req.session!.state,
    });

    delete req.session!.codeVerifier;
    delete req.session!.state;

    const sessionId = randomUUID();

    await redisClient.setEx(
      `tokens:${sessionId}`,
      TOKEN_TTL,
      JSON.stringify({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        idToken: tokens.id_token,
      })
    );

    const token = jwt.sign({ sessionId }, config.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('jwt_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.NODE_ENV === 'production',
      maxAge: TOKEN_TTL * 1000,
    });

    res.redirect(`${config.CORS_ORIGIN}/auth-signed-in`);
  } catch {
    res.redirect(`${config.CORS_ORIGIN}/authorize`);
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  const token = req.cookies?.jwt_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as { sessionId: string };
      await redisClient.del(`tokens:${decoded.sessionId}`);
    } catch {
      // token already invalid — nothing to clean up
    }
  }
  res.clearCookie('jwt_token', { sameSite: 'lax', secure: config.NODE_ENV === 'production' });
  req.session.destroy(() => res.json({ ok: true }));
});

export default router;
