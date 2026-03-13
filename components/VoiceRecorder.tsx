'use client';

import { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl
  } = useReactMediaRecorder({
    audio: {
      // VYPNUTO vše co mohlo kazit zvuk
      echoCancellation: false,  // VYPNUTO - může způsobovat "plechový" zvuk
      noiseSuppression: false,   // VYPNUTO - může ořezávat výšky
      autoGainControl: false,    // VYPNUTO - může dělat "zahuhlaný" zvuk
      
      // Základní nastavení
      sampleRate: 44100,         // Klasická CD kvalita
      channelCount: 1,           // Mono je pro hlas nejlepší
      
      // Důležité pro kvalitu
      latency: 0,                // Minimální zpoždění
    } as MediaTrackConstraints,
    
    // Použijeme nejjednodušší možný formát
    blobPropertyBag: {
      type: 'audio/webm',        // Základní WebM
    },
    
    mediaRecorderOptions: {
      mimeType: 'audio/webm',
      audioBitsPerSecond: 192000, // 192 kbps - dostatečná kvalita
    },
    
    onStop: (blobUrl: string, blob: Blob) => {
      console.log('🎵 RAW Audio:', {
        size: blob.size,
        type: blob.type,
        duration: '5s'
      });
      setAudioBlob(blob);
      onRecordingComplete(blob);
    }
  });

  const resetRecording = (): void => {
    setAudioBlob(null);
    clearBlobUrl();
  };

  const handleStartRecording = () => {
    startRecording();
    setTimeout(() => {
      if (status === 'recording') {
        stopRecording();
      }
    }, 5000);
  };

  return (
    <div className="border border-black rounded-xl p-8 w-full max-w-md text-center">
      <div className="text-xs text-gray-400 mb-2">
        🎵 RAW Audio (žádné úpravy)
      </div>

      {status === 'recording' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="animate-pulse text-red-500">🔴</span>
            <span className="text-black">Recording... (max 5 seconds)</span>
          </div>
          <button
            onClick={stopRecording}
            className="border border-black rounded-full px-6 py-2 text-black hover:bg-black hover:text-white transition-colors"
          >
            Stop Recording
          </button>
        </div>
      ) : mediaBlobUrl ? (
        <div className="space-y-4">
          <audio src={mediaBlobUrl} controls className="w-full" />
          <div className="flex gap-2 justify-center">
            <button
              onClick={resetRecording}
              className="border border-black rounded-full px-4 py-1 text-sm text-black hover:bg-black hover:text-white transition-colors"
            >
              Record Again
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleStartRecording}
          className="border border-black rounded-full px-8 py-3 text-black hover:bg-black hover:text-white transition-colors"
        >
          Start Recording
        </button>
      )}
    </div>
  );
}