import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const keys = await redis.keys('msg:*');
    
    const messages = await Promise.all(
      keys.map(async (key) => {
        const data = await redis.hgetall(key);
        
        // Pokud data nejsou null, vytvoříme zprávu
        if (data) {
          return {
            id: key.replace('msg:', ''),
            type: data.type as 'text' | 'voice' || 'text',
            content: data.content as string | undefined,
            voiceUrl: data.voiceUrl as string | undefined,
            created: Number(data.created) || Date.now(),
          };
        }
        return null; // přeskočíme prázdné záznamy
      })
    );

    // Filtrujeme null hodnoty
    const validMessages = messages.filter(msg => msg !== null);
    
    // Seřadíme od nejnovějších
    validMessages.sort((a, b) => b!.created - a!.created);

    return NextResponse.json(validMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}