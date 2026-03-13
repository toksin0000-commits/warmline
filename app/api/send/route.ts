import { redis } from '@/lib/redis';

interface VoiceMessage {
  type: 'voice';
  voiceUrl: string;
}

interface TextMessage {
  type: 'text';
  content: string;
}

type MessageData = VoiceMessage | TextMessage;

export async function POST(req: Request) {
  const body = await req.json() as MessageData;
  
  // Validace
  if (!['text', 'voice'].includes(body.type)) {
    return new Response('Invalid type', { status: 400 });
  }

  const id = crypto.randomUUID();
  
  const message: Record<string, string | number> = {
    type: body.type,
    created: Date.now()
  };

  if (body.type === 'text') {
    if (!body.content || body.content.length > 120) {
      return new Response('Invalid content', { status: 400 });
    }
    message.content = body.content;
  } else {
    if (!body.voiceUrl) {
      return new Response('Voice URL required', { status: 400 });
    }
    message.voiceUrl = body.voiceUrl;
  }

  await redis.hset(`msg:${id}`, message);
  
  // Nastavit expiraci po 7 dnech
  await redis.expire(`msg:${id}`, 7 * 24 * 60 * 60);

  return new Response('OK');
}