'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useRandomColor } from '@/hooks/useRandomColor';
import useSound from 'use-sound';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

const VoiceRecorder = dynamic<VoiceRecorderProps>(
  () => import('@/components/VoiceRecorder'),
  { 
    ssr: false,
    loading: () => (
      <div className="border rounded-xl p-8 w-full max-w-md text-center">
        <p>Loading recorder...</p>
      </div>
    )
  }
);

export default function ComposePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    }>
      <InnerComposePage />
    </Suspense>
  );
}

function InnerComposePage() {
  const params = useSearchParams();
  const mode = params.get('mode') as 'text' | 'voice' | null;
  const router = useRouter();
  const colors = useRandomColor();

  const [text, setText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showEnvelope, setShowEnvelope] = useState<boolean>(false);

  // 🎵 Zvuky
  const [playFly] = useSound('/sounds/envelope-fly.mp3', { volume: 0.5 });
  const [playButtonClick] = useSound('/sounds/button-click.mp3', { volume: 0.4 });
  

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = colors.bg;
      document.body.style.color = colors.text;
    }
  }, [colors]);

  const send = async (): Promise<void> => {
    setSending(true);
    playButtonClick(); // 🎵 Kliknutí na tlačítko

    try {
      if (mode === 'voice' && audioBlob) {
        const formData = new FormData();
        const fileExtension = audioBlob.type.includes('wav') ? 'wav' : 'webm';
        const fileName = `recording-${Date.now()}.${fileExtension}`;
        formData.append('audio', audioBlob, fileName);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload failed (${uploadRes.status})`);
        }
        
        const { url } = await uploadRes.json();
        
        const sendRes = await fetch('/api/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'voice',
            voiceUrl: url
          })
        });

        if (!sendRes.ok) {
          const errorData = await sendRes.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to save message');
        }
      } else if (mode === 'text' && text.trim()) {
        const sendRes = await fetch('/api/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'text',
            content: text.trim()
          })
        });

        if (!sendRes.ok) {
          const errorData = await sendRes.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to save message');
        }
      } else {
        throw new Error('No message to send');
      }

      // ✅ Úspěšné odeslání
      
      setShowEnvelope(true);
      playFly(); // 🎵 Odlet obálky
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setSending(false);
      alert(`Failed to send message: ${error instanceof Error ? error.message : 'Please try again'}`);
    }
  };

  const handleRecordingComplete = (blob: Blob): void => {
    setAudioBlob(blob);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 relative overflow-hidden" style={{ backgroundColor: colors.bg }}>
      {/* Animace odlétající obálky */}
      <AnimatePresence>
        {showEnvelope && (
          <motion.div
            initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
            animate={{ 
              y: -300, 
              x: 200, 
              opacity: 0, 
              rotate: 20,
              scale: 0.5
            }}
            transition={{ 
              duration: 1.8, 
              ease: "easeInOut" 
            }}
            className="absolute z-50"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative w-32 h-24">
              <div className="absolute inset-0 bg-white border-2 rounded-lg shadow-xl" style={{ borderColor: colors.accent }}>
                <div className="absolute top-0 left-0 right-0 h-1/2 border-b bg-white origin-top" style={{ borderColor: colors.accent }} />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                style={{ color: colors.accent }}
              >
                {mode === 'text' ? '✉️ Your message is on its way!' : '🎤 Your voice is flying away!'}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`transition-opacity duration-300 ${showEnvelope ? 'opacity-30' : 'opacity-100'} w-full max-w-md`}>
        <p className="mb-8 text-center max-w-md mx-auto" style={{ color: colors.text, opacity: 0.7 }}>
          {mode === 'text'
            ? 'Write something you would love to receive yourself.'
            : 'Say something that could brighten someone’s day.'}
        </p>

        {mode === 'text' && (
          <div className="w-full">
            <textarea
              className="border rounded-xl p-4 w-full h-40 focus:outline-none focus:ring-2 transition-all"
              style={{ 
                borderColor: colors.accent,
                color: colors.text,
                backgroundColor: 'transparent'
              }}
              maxLength={120}
              placeholder="Write a short sentence…"
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
              disabled={sending || showEnvelope}
            />
            <p className="text-right text-sm mt-1" style={{ color: colors.text, opacity: 0.5 }}>
              {text.length}/120
            </p>
          </div>
        )}

        {mode === 'voice' && (
          <VoiceRecorder 
            onRecordingComplete={handleRecordingComplete}
          />
        )}

        <button
          onClick={send}
          disabled={
            sending || 
            showEnvelope ||
            (mode === 'text' && !text.trim()) || 
            (mode === 'voice' && !audioBlob)
          }
          className="mt-8 border rounded-full px-8 py-3 w-full transition-colors disabled:opacity-40"
          style={{ 
            borderColor: colors.accent,
            color: colors.text,
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!sending && !showEnvelope) {
              e.currentTarget.style.backgroundColor = colors.accent;
              e.currentTarget.style.color = colors.bg;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.text;
          }}
        >
          {sending ? 'Sending…' : showEnvelope ? 'Sent! ✨' : 'Send'}
        </button>

        <button
          onClick={() => {
            playButtonClick(); // 🎵 Zvuk při kliknutí na Back
            router.push('/');
          }}
          disabled={sending || showEnvelope}
          className="mt-4 text-sm w-full transition-colors disabled:opacity-40"
          style={{ color: colors.text, opacity: 0.5 }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}