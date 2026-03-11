'use client';


import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';


export default function ComposePage() {
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
      {/* Nadpis */}
      <p className="text-black mb-6">
        {mode === 'text'
          ? 'Napiš něco, co bys sám rád dostal.'
          : 'Řekni něco, co může někomu zlepšit den.'}
      </p>

      {/* Textový režim */}
      {mode === 'text' && (
        <textarea
          className="border border-black rounded-xl p-4 w-full max-w-md h-40 text-black"
          maxLength={120}
          placeholder="Napiš krátkou větu…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
      )}

      {/* Hlasový režim */}
      {mode === 'voice' && (
        <div className="border border-black rounded-xl p-8 w-full max-w-md text-center text-black">
          🎙️ Zde bude nahrávání hlasu (max 5 sekund)
        </div>
      )}

      {/* Odeslat */}
      <button
        onClick={send}
        disabled={sending || (mode === 'text' && !text)}
        className="mt-8 border border-black rounded-full px-8 py-3 text-black disabled:opacity-40"
      >
        {sending ? 'Odesílám…' : 'Odeslat'}
      </button>
    </div>
  );
}
