import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
  console.error('Missing Redis environment variables');
}

export const redis = Redis.fromEnv();