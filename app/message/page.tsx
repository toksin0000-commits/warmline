'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRandomColor } from '@/hooks/useRandomColor';
import useSound from 'use-sound';

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
  const [userInteracted, setUserInteracted] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedSourceLang, setDetectedSourceLang] = useState<string | null>(null);
  
  // 🔥 REF PRO ZABRÁNĚNÍ NÁSOBNÉMU PŘEKLADU
  const hasTranslatedRef = useRef(false);
  
  const colors = useRandomColor();

  // 🎵 Zvuky
  const [playBackground, { stop: stopBackground }] = useSound('/sounds/message-atmosphere.mp3', {
    volume: 0.3,
    loop: true,
  });
  const [playButtonClick] = useSound('/sounds/button-click.mp3', { volume: 0.4 });

  // Spustíme podkres při načtení stránky
  useEffect(() => {
    if (!loading && message) {
      playBackground();
    }
    return () => {
      stopBackground();
    };
  }, [loading, message, playBackground, stopBackground]);

  // Zastavíme podkres při první interakci
  useEffect(() => {
    if (userInteracted) {
      stopBackground();
    }
  }, [userInteracted, stopBackground]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = colors.bg;
      document.body.style.color = colors.text;
    }
  }, [colors]);

  useEffect(() => {
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

  // --- OPTIMALIZOVANÝ EFEKT PRO PŘEKLAD ---
  useEffect(() => {
    // Spustí se jen jednou, když máme textovou zprávu
    if (message?.type === 'text' && message.content && !hasTranslatedRef.current) {
      hasTranslatedRef.current = true; // 🔥 Označíme, že už jsme překládali
      
      const translateMessage = async () => {
        setIsTranslating(true);
        const targetLang = navigator.language.split('-')[0];

        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: message.content,
              targetLanguage: targetLang,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Chyba překladu:', errorData.error);
            return;
          }

          const data = await response.json();
          setTranslatedContent(data.translatedText);
          if (data.detectedSourceLanguage) {
            setDetectedSourceLang(data.detectedSourceLanguage);
          }
        } catch (error) {
          console.error('Chyba při volání překladové API:', error);
        } finally {
          setIsTranslating(false);
        }
      };

      translateMessage();
    }
  }, [message]); // ✅ Závislost jen na message, ne na translatedContent

  const handleInteraction = (callback?: () => void) => {
    setUserInteracted(true);
    playButtonClick();
    if (callback) callback();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen" style={{ backgroundColor: colors.bg }}>
        <div className="border rounded-xl p-8 w-full max-w-md shadow-sm animate-pulse" style={{ borderColor: colors.accent, backgroundColor: colors.bg }}>
          <div className="h-4 rounded w-3/4 mb-4" style={{ backgroundColor: colors.accent, opacity: 0.2 }}></div>
          <div className="h-20 rounded" style={{ backgroundColor: colors.accent, opacity: 0.1 }}></div>
        </div>
        <p className="mt-4" style={{ color: colors.text }}>Opening your message…</p>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6" style={{ backgroundColor: colors.bg }}>
        <div className="border rounded-xl p-12 w-full max-w-md text-center" style={{ borderColor: colors.accent }}>
          <div className="text-6xl mb-4" style={{ color: colors.accent }}>📭</div>
          <h2 className="text-2xl font-light mb-2" style={{ color: colors.text }}>
            {error ? 'Something went wrong' : 'No messages yet'}
          </h2>
          <p className="mb-8" style={{ color: colors.text, opacity: 0.6 }}>
            {error 
              ? 'Please try again later.' 
              : 'Be the first to send someone a kind word!'}
          </p>
          <Link
            href="/compose?mode=text"
            onClick={() => handleInteraction()}
            className="inline-block rounded-full px-8 py-3 transition-colors"
            style={{ 
              borderColor: colors.accent, 
              borderWidth: '1px',
              color: colors.text,
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent;
              e.currentTarget.style.color = colors.bg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text;
            }}
          >
            Write a message
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(message.created).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12" style={{ backgroundColor: colors.bg }}>
      <div className="border rounded-xl p-8 w-full max-w-md shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: colors.accent }}>
        <div className="flex justify-between items-center mb-4 text-sm" style={{ color: colors.text, opacity: 0.6 }}>
          <span>💌 Someone sent you this today</span>
          {message.created && <span>{formattedDate}</span>}
        </div>

        {message.type === 'text' && message.content && (
  <div className="min-h-[150px] flex items-center justify-center p-6 rounded-lg" 
       style={{ 
         backgroundColor: `${colors.accent}08`,
         border: `1px solid ${colors.accent}20`
       }}>
    {isTranslating ? (
      <div className="flex flex-col items-center gap-2">
        <div className="animate-pulse text-lg" style={{ color: colors.accent }}>
          Translating...
        </div>
        <div className="text-sm opacity-50">✨</div>
      </div>
    ) : (
      <div className="w-full">
        {/* Původní text (menší, nahoře) */}
        <p className="text-sm mb-2 opacity-60 text-center" 
           style={{ color: colors.text }}>
          Original: "{message.content}"
        </p>
        
        {/* Přeložený text (hlavní, větší) */}
        <p className="text-2xl md:text-4xl font-light italic leading-relaxed text-center break-words" 
           style={{ 
             color: colors.text,
             fontFamily: "'Palatino', 'Georgia', serif",
             letterSpacing: '0.02em',
             lineHeight: '1.7'
           }}>
          {translatedContent || message.content}
        </p>
      </div>
    )}
  </div>
)}
        
        {message.type === 'text' && translatedContent && !isTranslating && (
          <div className="flex justify-end items-center mt-2 text-xs" style={{ color: colors.accent }}>
            <span>🌐 Translated</span>
            {detectedSourceLang && <span className="ml-1 opacity-70">(from {detectedSourceLang.toUpperCase()})</span>}
          </div>
        )}

        {message.type === 'voice' && message.voiceUrl && (
          <div className="space-y-3">
            <audio 
              controls 
              className="w-full"
              style={{ 
                borderRadius: '8px',
                border: `1px solid ${colors.accent}`
              }}
              onPlay={() => handleInteraction()}
              onError={(e) => {
                console.error('Audio playback error:', e);
                setError('Failed to load audio');
              }}
            >
              <source src={message.voiceUrl} type="audio/webm" />
              <source src={message.voiceUrl} type="audio/mp4" />
              Your browser does not support the audio element.
            </audio>
            <p className="text-xs text-center" style={{ color: colors.text, opacity: 0.5 }}>
              Voice message · ~8 seconds
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 text-center w-full max-w-md">
        <p className="mb-6 text-lg" style={{ color: colors.text }}>
          Now it&apos;s your turn to brighten someone&apos;s day ✨
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/compose?mode=text"
            onClick={() => handleInteraction()}
            className="rounded-full px-6 py-3 transition-colors text-center"
            style={{ 
              borderColor: colors.accent, 
              borderWidth: '1px',
              color: colors.text
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent;
              e.currentTarget.style.color = colors.bg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text;
            }}
          >
            Write a sentence
          </Link>

          <Link
            href="/compose?mode=voice"
            onClick={() => handleInteraction()}
            className="rounded-full px-6 py-3 transition-colors text-center"
            style={{ 
              borderColor: colors.accent, 
              borderWidth: '1px',
              color: colors.text
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent;
              e.currentTarget.style.color = colors.bg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text;
            }}
          >
            Record voice message
          </Link>
        </div>

        <p className="text-xs mt-8" style={{ color: colors.text, opacity: 0.4 }}>
          Messages disappear after 7 days · Share the love
        </p>
      </div>
    </div>
  );
}