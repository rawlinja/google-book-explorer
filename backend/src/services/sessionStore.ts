import { MemcacheClient } from 'memcache-client';

const client = new MemcacheClient({ server: 'localhost:11211' });

export default {
  async get(id: string) {
    return await client.get(id);
  },
  async set(id: string, data: any, options?: any) {
    return await client.set(id, data, options);
  },
};
