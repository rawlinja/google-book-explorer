import { Redis } from 'ioredis';
import { config } from '../config/index.js';

// lazyConnect: importing this module must not open a connection.
export const redis = new Redis(config.REDIS_URL, { lazyConnect: true });
