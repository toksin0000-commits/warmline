import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return NextResponse.json({}, { headers });
  }

  try {
    const body = await req.json();
    
    if (!body || !body.type) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400, headers }
      );
    }

    const id = crypto.randomUUID();
    
    const message: any = {
      type: body.type,
      created: Date.now()
    };

    if (body.type === 'text') {
      if (!body.content || body.content.length > 120) {
        return NextResponse.json(
          { error: 'Invalid content' },
          { status: 400, headers }
        );
      }
      message.content = body.content;
    } else if (body.type === 'voice') {
      if (!body.voiceUrl) {
        return NextResponse.json(
          { error: 'Voice URL required' },
          { status: 400, headers }
        );
      }
      message.voiceUrl = body.voiceUrl;
    } else {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400, headers }
      );
    }

    await redis.hset(`msg:${id}`, message);
    await redis.expire(`msg:${id}`, 7 * 24 * 60 * 60);

    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error('Send error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500, headers }
    );
  }
}