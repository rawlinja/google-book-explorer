import { createClient } from 'redis';
import { config } from '../config/index.js';

export const redisClient = createClient({ url: config.REDIS_URL });
redisClient.connect().catch(console.error);
