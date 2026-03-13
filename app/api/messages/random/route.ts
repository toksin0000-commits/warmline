import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const keys = await redis.keys('msg:*');

    if (keys.length === 0) {
      return NextResponse.json(null);
    }

    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const data = await redis.hgetall(randomKey);
    
    if (!data) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      type: (data.type as 'text' | 'voice') ?? 'text',
      content: data.content as string | undefined,
      voiceUrl: data.voiceUrl as string | undefined,
      created: Number(data.created) ?? Date.now(),
    });
    
  } catch (error) {
    console.error('Error in random endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random message' },
      { status: 500 }
    );
  }
}