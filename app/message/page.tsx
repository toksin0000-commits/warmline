'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Message {
  type: 'text' | 'voice';
  content?: string;
  voiceUrl?: string;
  created: number;
}

export default function MessagePage() {
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ ZMĚNA: /api/message → /api/messages/random
    fetch('/api/messages/random')
      .then(async r => {
        if (!r.ok) {
          throw new Error('Failed to fetch message');
        }
        const data = await r.json();
        setMessage(data);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        {/* Skeleton loading */}
        <div className="border border-black rounded-xl p-8 w-full max-w-md bg-white shadow-sm animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <p className="text-black mt-4">Opening your message…</p>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
        <div className="border border-black rounded-xl p-12 w-full max-w-md text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-light text-black mb-2">
            {error ? 'Something went wrong' : 'No messages yet'}
          </h2>
          <p className="text-gray-600 mb-8">
            {error 
              ? 'Please try again later.' 
              : 'Be the first to send someone a kind word!'}
          </p>
          <Link
            href="/compose?mode=text"
            className="inline-block border border-black rounded-full px-8 py-3 text-black hover:bg-black hover:text-white transition-colors"
          >
            Write a message
          </Link>
        </div>
      </div>
    );
  }

  // Formátování času
  const formattedDate = new Date(message.created).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 py-12">
      {/* Message Card */}
      <div className="border border-black rounded-xl p-8 w-full max-w-md bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
          <span>💌 Someone sent you this today</span>
          {message.created && <span>{formattedDate}</span>}
        </div>

        {message.type === 'text' && message.content && (
          <div className="min-h-[100px]">
            <p className="text-lg leading-relaxed text-black whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        )}

        {message.type === 'voice' && message.voiceUrl && (
          <div className="space-y-3">
            <audio 
              controls 
              className="w-full"
              onError={(e) => {
                console.error('Audio playback error:', e);
                setError('Failed to load audio');
              }}
            >
              <source src={message.voiceUrl} type="audio/webm" />
              <source src={message.voiceUrl} type="audio/mp4" />
              Your browser does not support the audio element.
            </audio>
            <p className="text-xs text-gray-500 text-center">
              Voice message · ~5 seconds
            </p>
          </div>
        )}
      </div>

      {/* Call to action */}
      <div className="mt-12 text-center w-full max-w-md">
        <p className="text-black mb-6 text-lg">
          Now it&apos;s your turn to brighten someone&apos;s day ✨
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/compose?mode=text"
            className="border border-black rounded-full px-6 py-3 text-black hover:bg-black hover:text-white transition-colors text-center"
          >
            Write a sentence
          </Link>

          <Link
            href="/compose?mode=voice"
            className="border border-black rounded-full px-6 py-3 text-black hover:bg-black hover:text-white transition-colors text-center"
          >
            Record voice message
          </Link>
        </div>

        {/* Decorative element */}
        <p className="text-xs text-gray-400 mt-8">
          Messages disappear after 7 days · Share the love
        </p>
      </div>
    </div>
  );
}