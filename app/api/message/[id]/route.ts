import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  context: Context
) {
  try {
    const { id } = await context.params;
    const key = `msg:${id}`;
    await redis.del(key);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}