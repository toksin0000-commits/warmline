import { redis } from '@/lib/redis';

export async function GET() {
  try {
    console.log('Redis keys:', await redis.keys('*')); // DEBUG
    
    const keys = await redis.keys('msg:*');
    console.log('Message keys:', keys); // DEBUG

    if (keys.length === 0) {
      return Response.json(null);
    }

    const random = keys[Math.floor(Math.random() * keys.length)];
    const msg = await redis.hgetall(random);
    
    console.log('Random message:', msg); // DEBUG
    return Response.json(msg);
    
  } catch (error) {
    console.error('Redis error:', error);
    return Response.json(
      { error: 'Failed to fetch message' }, 
      { status: 500 }
    );
  }
}