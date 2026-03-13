'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

// Definice props pro VoiceRecorder
interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

// Dynamický import s typem a loading fallback
const VoiceRecorder = dynamic<VoiceRecorderProps>(
  () => import('@/components/VoiceRecorder'),
  { 
    ssr: false,
    loading: () => (
      <div className="border border-black rounded-xl p-8 w-full max-w-md text-center">
        <p className="text-black">Loading recorder...</p>
      </div>
    )
  }
);

export default function ComposePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <p className="text-black">Loading...</p>
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

  const [text, setText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showEnvelope, setShowEnvelope] = useState<boolean>(false);

  const send = async (): Promise<void> => {
    setSending(true);

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

      // ✅ Spustíme animaci odlétající obálky
      setShowEnvelope(true);
      
      // ✅ Po 2 sekundách přesměrujeme na homepage
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
    console.log('Recording complete:', {
      size: blob.size,
      type: blob.type
    });
    setAudioBlob(blob);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 py-12 relative overflow-hidden">
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
              {/* Obálka */}
              <div className="absolute inset-0 bg-white border-2 border-black rounded-lg shadow-xl">
                {/* Chlopeň */}
                <div className="absolute top-0 left-0 right-0 h-1/2 border-b border-black bg-white origin-top transform rotate-0" />
              </div>
              {/* Text "Thank you" nebo něco podobného */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-black whitespace-nowrap"
              >
                {mode === 'text' ? '✉️ Your message is on its way!' : '🎤 Your voice is flying away!'}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Původní obsah (zůstává, ale může být ztlumený během animace) */}
      <div className={`transition-opacity duration-300 ${showEnvelope ? 'opacity-30' : 'opacity-100'}`}>
        <p className="text-black mb-8 text-center max-w-md">
          {mode === 'text'
            ? 'Write something you would love to receive yourself.'
            : 'Say something that could brighten someone’s day.'}
        </p>

        {mode === 'text' && (
          <div className="w-full max-w-md">
            <textarea
              className="border border-black rounded-xl p-4 w-full h-40 text-black focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
              maxLength={120}
              placeholder="Write a short sentence…"
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
              disabled={sending || showEnvelope}
            />
            <p className="text-right text-sm text-gray-500 mt-1">
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
          className="mt-8 border border-black rounded-full px-8 py-3 text-black disabled:opacity-40 hover:bg-black hover:text-white transition-colors disabled:hover:bg-transparent disabled:hover:text-black"
        >
          {sending ? 'Sending…' : showEnvelope ? 'Sent! ✨' : 'Send'}
        </button>

        <button
          onClick={() => router.push('/')}
          disabled={sending || showEnvelope}
          className="mt-4 text-sm text-gray-500 hover:text-black transition-colors disabled:opacity-40"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}