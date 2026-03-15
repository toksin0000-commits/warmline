import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 🔍 DEBUG: Výpis proměnných prostředí
    console.log('🔍 AZURE_TRANSLATOR_KEY exists:', !!process.env.AZURE_TRANSLATOR_KEY);
    console.log('🔍 AZURE_TRANSLATOR_ENDPOINT:', process.env.AZURE_TRANSLATOR_ENDPOINT);
    console.log('🔍 AZURE_TRANSLATOR_REGION:', process.env.AZURE_TRANSLATOR_REGION);

    // 1. Přečteme data, která nám pošle frontend (prohlížeč)
    const { text, targetLanguage } = await req.json();
    console.log('🔍 Přijatý text:', text, 'Cílový jazyk:', targetLanguage);

    // 2. Základní validace
    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Chybí text nebo cílový jazyk' },
        { status: 400 }
      );
    }

    // 3. Vezmeme API klíč a endpoint z bezpečných proměnných prostředí
    const apiKey = process.env.AZURE_TRANSLATOR_KEY;
    const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
    const region = process.env.AZURE_TRANSLATOR_REGION;

    if (!apiKey || !endpoint) {
      console.error('❌ Chybí konfigurace API klíče nebo endpointu.');
      return NextResponse.json(
        { error: 'Chyba konfigurace serveru' },
        { status: 500 }
      );
    }

    // 4. Sestavíme URL pro volání Azure Translator API
    const url = new URL('/translate', endpoint);
    url.searchParams.append('api-version', '3.0');
    url.searchParams.append('to', targetLanguage);
    console.log('🔍 Volám Azure URL:', url.toString());

    // 5. Zavoláme Azure Translator API
    const azureResponse = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': region || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ text }]),
    });

    // 6. Zpracujeme odpověď z Azure
    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      console.error('❌ Chyba od Azure API:', azureResponse.status, errorText);
      return NextResponse.json(
        { error: `Překlad se nezdařil: ${azureResponse.status}` },
        { status: 500 }
      );
    }

    const azureData = await azureResponse.json();
    console.log('🔍 Odpověď z Azure:', JSON.stringify(azureData, null, 2));

    const translatedText = azureData[0]?.translations[0]?.text;

    if (!translatedText) {
      return NextResponse.json(
        { error: 'Nepodařilo se získat přeložený text' },
        { status: 500 }
      );
    }

    // 7. Pošleme přeložený text zpět do prohlížeče
    console.log('✅ Překlad úspěšný:', translatedText);
    return NextResponse.json({ translatedText });
    
  } catch (error) {
    console.error('❌ Neočekávaná chyba při překladu:', error);
    return NextResponse.json(
      { error: 'Interní chyba serveru' },
      { status: 500 }
    );
  }
}