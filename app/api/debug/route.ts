import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const keys = await redis.keys('msg:*');
    
    const rawMessages = await Promise.all(
      keys.map(async (key) => {
        const data = await redis.hgetall(key);
        return {
          key,
          data
        };
      })
    );

    return NextResponse.json({
      count: keys.length,
      keys: keys,
      rawMessages: rawMessages
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}