import { redis } from '@/lib/redis';

export async function GET() {
  const keys = await redis.keys('msg:*');

  if (keys.length === 0) {
    return Response.json(null);
  }

  const random = keys[Math.floor(Math.random() * keys.length)];
  const msg = await redis.hgetall(random);

  return Response.json(msg);
}
