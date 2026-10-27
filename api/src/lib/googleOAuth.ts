import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/index.js';

export function createOAuthClient(): OAuth2Client {
  return new OAuth2Client({
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    redirectUri: config.GOOGLE_REDIRECT_URI,
  });
}
