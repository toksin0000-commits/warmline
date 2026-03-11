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
        <p className="text-black">Loading your message…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white px-6">
      {/* Card */}
      <div className="border border-black rounded-xl p-8 w-full max-w-md bg-white shadow-sm">
        <p className="text-sm text-gray-600 mb-4">Someone sent you this today:</p>

        {message.type === 'text' && (
          <p className="text-lg leading-relaxed text-black">
            {message.content}
          </p>
        )}

        {message.type === 'voice' && (
          <audio controls src={message.voice_url} className="w-full" />
        )}
      </div>

      {/* Call to action */}
      <div className="mt-10 text-center">
        <p className="text-black mb-4">Now you can pass something forward.</p>

        <div className="flex gap-4 justify-center">
          <a
            href="/compose?mode=text"
            className="border border-black rounded-full px-6 py-2"
          >
            Write a sentence
          </a>

          <a
            href="/compose?mode=voice"
            className="border border-black rounded-full px-6 py-2"
          >
            Record a voice message
          </a>
        </div>
      </div>
    </div>
  );
}
