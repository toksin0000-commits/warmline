'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import dynamic from 'next/dynamic';

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

  const send = async (): Promise<void> => {
    setSending(true);

    try {
      if (mode === 'voice' && audioBlob) {
        // Pro voice nejdřív nahrajeme audio na server
        const formData = new FormData();
        
        // ✅ Dynamický název podle typu souboru
        const fileExtension = audioBlob.type.includes('wav') ? 'wav' : 'webm';
        const fileName = `recording-${Date.now()}.${fileExtension}`;
        formData.append('audio', audioBlob, fileName);
        
        console.log('Uploading:', {
          size: audioBlob.size,
          type: audioBlob.type,
          name: fileName
        });
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload failed (${uploadRes.status})`);
        }
        
        const { url } = await uploadRes.json();
        console.log('Upload success:', url);
        
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
        // Pro textové zprávy
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

      router.push('/');
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 py-12">
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
          (mode === 'text' && !text.trim()) || 
          (mode === 'voice' && !audioBlob)
        }
        className="mt-8 border border-black rounded-full px-8 py-3 text-black disabled:opacity-40 hover:bg-black hover:text-white transition-colors disabled:hover:bg-transparent disabled:hover:text-black"
      >
        {sending ? 'Sending…' : 'Send'}
      </button>

      <button
        onClick={() => router.push('/')}
        className="mt-4 text-sm text-gray-500 hover:text-black transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}