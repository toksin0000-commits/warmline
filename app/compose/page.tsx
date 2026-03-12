'use client';
export const dynamic = "force-dynamic";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ComposePage() {
  return (
    <Suspense fallback={null}>
      <InnerComposePage />
    </Suspense>
  );
}

function InnerComposePage() {
  const params = useSearchParams();
  const mode = params.get('mode');
  const router = useRouter();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);

    await fetch('/api/send', {
      method: 'POST',
      body: JSON.stringify({
        type: mode,
        content: text
      })
    });

    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white px-6">
      <p className="text-black mb-6">
        {mode === 'text'
          ? 'Write something you would love to receive yourself.'
          : 'Say something that could brighten someone’s day.'}
      </p>

      {mode === 'text' && (
        <textarea
          className="border border-black rounded-xl p-4 w-full max-w-md h-40 text-black"
          maxLength={120}
          placeholder="Write a short sentence…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
      )}

      {mode === 'voice' && (
        <div className="border border-black rounded-xl p-8 w-full max-w-md text-center text-black">
          🎙️ Voice recording will appear here (max 5 seconds)
        </div>
      )}

      <button
        onClick={send}
        disabled={sending || (mode === 'text' && !text)}
        className="mt-8 border border-black rounded-full px-8 py-3 text-black disabled:opacity-40"
      >
        {sending ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}
