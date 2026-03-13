import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Najdeme všechny klíče zpráv
    const keys = await redis.keys('msg:*');
    
    if (keys.length === 0) {
      return NextResponse.json({ 
        message: 'No messages to delete',
        deleted: 0 
      });
    }

    // Smažeme všechny najednou
    await redis.del(...keys);
    
    return NextResponse.json({ 
      success: true, 
      deleted: keys.length,
      message: `Successfully deleted ${keys.length} messages`
    });
    
  } catch (error) {
    console.error('Error clearing messages:', error);
    return NextResponse.json(
      { error: 'Failed to clear messages' },
      { status: 500 }
    );
  }
}

// Pro testování v prohlížeči (GET)
export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to clear messages' 
  });
}