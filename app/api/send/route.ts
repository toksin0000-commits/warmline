import { redis } from '@/lib/redis';

export async function POST(req: Request) {
  const { type, content } = await req.json();

  // Vytvoříme unikátní ID zprávy
  const id = crypto.randomUUID();

  await redis.hset(`msg:${id}`, {
    type,
    content,
    created: Date.now(),
  });

  return new Response('OK');
}
