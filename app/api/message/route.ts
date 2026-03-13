import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';
import { Message } from '@/types/message';

export async function GET() {
  try {
    const keys = await redis.keys('msg:*');
    
    const messages = await Promise.all(
      keys.map(async (key) => {
        const data = await redis.hgetall(key) as Record<string, string | number>;
        return {
          id: key.replace('msg:', ''),
          type: data.type as 'text' | 'voice',
          content: data.content as string | undefined,
          voiceUrl: data.voiceUrl as string | undefined,
          created: Number(data.created),
        } as Message;
      })
    );

    // Seřadíme od nejnovějších
    messages.sort((a, b) => b.created - a.created);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}