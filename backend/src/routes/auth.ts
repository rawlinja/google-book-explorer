import { Router, Request, Response } from 'express';
import * as openidClient from 'openid-client';
import { nanoid } from 'nanoid';

import jwt from 'jsonwebtoken';

const config = await openidClient.discovery(
  new URL('https://accounts.google.com'),
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!
);

const router = Router();

router.get('/google', async (req: Request, res: Response) => {
  const codeVerifier = openidClient.randomPKCECodeVerifier();
  const codeChallenge = await openidClient.calculatePKCECodeChallenge(codeVerifier);
  const state = openidClient.randomState();

  req.session!.codeVerifier = codeVerifier;
  req.session!.state = state;

  const parameters: Record<string, string> = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    scope: 'openid email profile https://www.googleapis.com/auth/books',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  };

  const url = openidClient.buildAuthorizationUrl(config, parameters);

  console.log(`Authorization URL: ${url.href}`);

  res.redirect(url.href);
});

router.get('/google/callback', async (req: Request, res: Response) => {
  const currentUrl = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);

  const tokens = await openidClient.authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: req.session!.codeVerifier,
    expectedState: req.session!.state,
  });

  const payload = {
    accessId: tokens.id_token,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  };

  const token = jwt.sign(payload, 'secret', {
    expiresIn: '1h',
  });

  res.cookie('jwt_token', token, {
    httpOnly: true,
    maxAge: 3600000, // 1 hour in milliseconds
  });

  res.redirect('http://localhost:5173/auth-signed-in');

  console.log('Token Endpoint Response', tokens);

});

export default router;
