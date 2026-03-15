import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Přečteme data, která nám pošle frontend (prohlížeč)
    const { text, targetLanguage } = await req.json();

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
      console.error('Chybí konfigurace API klíče nebo endpointu.');
      return NextResponse.json(
        { error: 'Chyba konfigurace serveru' },
        { status: 500 }
      );
    }

    // 4. Sestavíme URL pro volání Azure Translator API
    const url = new URL('/translate', endpoint);
    url.searchParams.append('api-version', '3.0');
    url.searchParams.append('to', targetLanguage);
    // Volitelně: můžeme přidat 'from' pro specifikaci zdrojového jazyka,
    // pokud ho známe. Jinak ho Azure detekuje automaticky.

    // 5. Zavoláme Azure Translator API
    const azureResponse = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': region || '', // Některé regiony to vyžadují
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ text }]), // API očekává pole textů
    });

    // 6. Zpracujeme odpověď z Azure
    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      console.error('Chyba od Azure API:', azureResponse.status, errorText);
      return NextResponse.json(
        { error: 'Překlad se nezdařil' },
        { status: 500 }
      );
    }

    const azureData = await azureResponse.json();
    // Odpověď je pole objektů, my bereme první překlad z prvního výsledku
    const translatedText = azureData[0]?.translations[0]?.text;

    if (!translatedText) {
      return NextResponse.json(
        { error: 'Nepodařilo se získat přeložený text' },
        { status: 500 }
      );
    }

    // 7. Pošleme přeložený text zpět do prohlížeče
    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Neočekávaná chyba při překladu:', error);
    return NextResponse.json(
      { error: 'Interní chyba serveru' },
      { status: 500 }
    );
  }
}