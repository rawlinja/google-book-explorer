import * as openidClient from 'openid-client';
import { config } from '../config/index.js';

export const oidcConfig = await openidClient.discovery(
  new URL('https://accounts.google.com'),
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET
);
