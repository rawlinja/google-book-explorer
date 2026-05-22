/**
 * Google OAuth 2.0 with PKCE — session-only auth
 *
 * We use Fastify's Redis-backed session as the sole auth mechanism rather than
 * issuing a separate JWT cookie. Since every request already hits Redis to load
 * the session, there is no additional round-trip cost. A JWT would buy stateless
 * verification, but we'd still need Redis to store and revoke Google tokens —
 * so the stateless benefit doesn't apply here. One mechanism is simpler and
 * easier to reason about.
 *
 * Flow:
 * 1. GET /auth/google          — generate PKCE verifier + state, store in session, redirect to Google
 * 2. GET /auth/google/callback — exchange code for tokens, store tokens in Redis under
 *                                tokens:{session.id}, mark session.authenticated = true
 * 3. POST /auth/logout         — delete Redis token entry, destroy session, clear session cookie
 *
 * Docs: https://developers.google.com/identity/protocols/oauth2/pkce
 * openid-client: https://github.com/panva/openid-client
 */
import { FastifyInstance } from 'fastify';
import * as openidClient from 'openid-client';
import { config } from '../config/index.js';
import { oidcConfig } from '../lib/oidc.js';

declare module '@fastify/session' {
  interface FastifySessionObject {
    codeVerifier?: string;
    state?: string;
    authenticated?: boolean;
    expiresAt?: number;
  }
}

const TOKEN_TTL = 3600;

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.get('/auth/google', async (req, reply) => {
    const codeVerifier = openidClient.randomPKCECodeVerifier();
    const codeChallenge = await openidClient.calculatePKCECodeChallenge(codeVerifier);
    const state = openidClient.randomState();

    req.session.codeVerifier = codeVerifier;
    req.session.state = state;

    const url = openidClient.buildAuthorizationUrl(oidcConfig, {
      redirect_uri: config.GOOGLE_REDIRECT_URI,
      scope: 'openid email profile https://www.googleapis.com/auth/books',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });

    return reply.redirect(url.href);
  });

  fastify.get('/auth/google/callback', async (req, reply) => {
    try {
      const qs = req.url.slice(req.url.indexOf('?'));
      const currentUrl = new URL(`${config.GOOGLE_REDIRECT_URI}${qs}`);

      const tokens = await openidClient.authorizationCodeGrant(oidcConfig, currentUrl, {
        pkceCodeVerifier: req.session.codeVerifier,
        expectedState: req.session.state,
      });

      delete req.session.codeVerifier;
      delete req.session.state;

      await fastify.redis.setex(
        `tokens:${req.session.sessionId}`,
        TOKEN_TTL,
        JSON.stringify({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? null,
          idToken: tokens.id_token,
        })
      );

      req.session.authenticated = true;
      req.session.expiresAt = Date.now() + TOKEN_TTL * 1000;

      return reply.redirect('/auth-signed-in');
    } catch (err) {
      req.log.error({ err }, 'OAuth callback failed');
      return reply.redirect('/authorize');
    }
  });

  fastify.post('/auth/logout', async (req, reply) => {
    await fastify.redis.del(`tokens:${req.session.sessionId}`);
    await req.session.destroy();
    reply.clearCookie('sessionId', { path: '/' });
    return reply.send({ ok: true });
  });
}
