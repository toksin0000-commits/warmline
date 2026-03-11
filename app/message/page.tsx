'use client';

import { useEffect, useState } from 'react';

export default function MessagePage() {
  const [message, setMessage] = useState<any>(null);

  useEffect(() => {
    fetch('/api/message')
      .then(r => r.json())
      .then(setMessage);
  }, []);

  if (!message) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-black">Načítám zprávu…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white px-6">
      {/* Lístek */}
      <div className="border border-black rounded-xl p-8 w-full max-w-md bg-white shadow-sm">
        <p className="text-sm text-gray-600 mb-4">Někdo ti dnes poslal tohle:</p>

        {message.type === 'text' && (
          <p className="text-lg leading-relaxed text-black">
            {message.content}
          </p>
        )}

        {message.type === 'voice' && (
          <audio controls src={message.voice_url} className="w-full" />
        )}
      </div>

      {/* Výzva k odeslání */}
      <div className="mt-10 text-center">
        <p className="text-black mb-4">A teď můžeš poslat něco dál.</p>

        <div className="flex gap-4 justify-center">
          <a
            href="/compose?mode=text"
            className="border border-black rounded-full px-6 py-2"
          >
            Napsat větu
          </a>

          <a
            href="/compose?mode=voice"
            className="border border-black rounded-full px-6 py-2"
          >
            Nahrát hlas
          </a>
        </div>
      </div>
    </div>
  );
}
