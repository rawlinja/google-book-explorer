/**
 * Google OAuth 2.0 with PKCE — session-only auth
 *
 * Sessions over JWT: Google tokens must stay server-side, so Redis is needed either way,
 * and a server-side session can be revoked instantly on logout.
 *
 * Flow:
 * 1. GET /auth/google          — generate PKCE verifier + state, store in session, redirect to Google
 * 2. GET /auth/google/callback — check state, exchange the code via OAuth2Client.getToken, store
 *                                tokens in Redis under tokens:{session.id}, mark session.authenticated
 * 3. POST /auth/logout         — delete Redis token entry, destroy session, clear session cookie
 *
 * Docs: https://developers.google.com/identity/protocols/oauth2/web-server
 */
import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { CodeChallengeMethod } from 'google-auth-library';
import { z } from 'zod';
import { createOAuthClient } from '../lib/googleOAuth.js';
import { saveTokens } from '../lib/googleAuth.js';
import { redis } from '../lib/redis.js';

declare module '@fastify/session' {
  interface FastifySessionObject {
    codeVerifier?: string;
    state?: string;
    authenticated?: boolean;
    expiresAt?: number;
  }
}

const TOKEN_TTL = 3600;
const SCOPES = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/books'];

const callbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.get('/auth/google', async (req, reply) => {
    const client = createOAuthClient();
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    if (!codeChallenge) throw new Error('PKCE code challenge was not generated');
    const state = randomBytes(32).toString('base64url');

    req.session.codeVerifier = codeVerifier;
    req.session.state = state;
    req.log.info('auth.login.started');

    const url = client.generateAuthUrl({
      scope: SCOPES,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
      state,
    });

    return reply.redirect(url);
  });

  fastify.get('/auth/google/callback', async (req, reply) => {
    try {
      const { codeVerifier, state } = req.session;
      if (!codeVerifier || !state) {
        req.log.warn('auth.callback.missing_session_state');
        return reply.redirect('/authorize');
      }

      const query = callbackQuerySchema.safeParse(req.query);
      if (!query.success) {
        req.log.warn('auth.callback.invalid_query');
        return reply.redirect('/authorize');
      }
      if (query.data.state !== state) {
        req.log.warn('auth.callback.state_mismatch');
        return reply.redirect('/authorize');
      }

      const { tokens } = await createOAuthClient().getToken({
        code: query.data.code,
        codeVerifier,
      });
      if (!tokens.access_token) throw new Error('Token response has no access token');
      req.log.info('auth.callback.tokens_exchanged');

      delete req.session.codeVerifier;
      delete req.session.state;

      await saveTokens(
        req.session.sessionId,
        {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          expiry_date: tokens.expiry_date ?? null,
        },
        TOKEN_TTL
      );
      req.log.info('auth.callback.tokens_stored');

      req.session.authenticated = true;
      req.session.expiresAt = Date.now() + TOKEN_TTL * 1000;

      return reply.redirect('/auth-signed-in');
    } catch (err) {
      req.log.error({ err }, 'auth.callback.failed');
      return reply.redirect('/authorize');
    }
  });

  fastify.post('/auth/logout', async (req, reply) => {
    await redis.del(`tokens:${req.session.sessionId}`);
    await req.session.destroy();
    reply.clearCookie('sessionId', { path: '/' });
    req.log.info('auth.logout.completed');
    return reply.send({ ok: true });
  });
}
