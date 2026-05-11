import { RedisStore } from 'connect-redis';
import session from 'express-session';
import { createClient } from 'redis';
import { config } from '../config/index.js';

const redisClient = createClient({ url: config.REDIS_URL });
redisClient.connect().catch(console.error);

const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'myapp:',
});

const sessionMiddleware = session({
  store: redisStore,
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  },
});

export default sessionMiddleware;
