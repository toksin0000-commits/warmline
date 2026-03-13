'use client';

import { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [supportedMimeType, setSupportedMimeType] = useState<string>('audio/webm');

  // Detekce podporovaného kodeku
  useEffect(() => {
    const getSupportedMimeType = (): string => {
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/mp4',
        'audio/wav',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ];
      
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          console.log('🎤 Supported mime type:', type);
          return type;
        }
      }
      return 'audio/webm';
    };

    setSupportedMimeType(getSupportedMimeType());
  }, []);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl
  } = useReactMediaRecorder({
    audio: {
      // Základní nastavení kvality
      sampleRate: 48000,
      channelCount: 1, // Mono je lepší pro hlas (místo stereo)
      
      // Potlačení dutého/plechového zvuku
      echoCancellation: true,     // ✅ ZAPNUTO - eliminuje ozvěnu
      noiseSuppression: true,      // ✅ ZAPNUTO - potlačuje šum pozadí
      autoGainControl: true,       // ✅ ZAPNUTO - vyrovnává hlasitost
      
      // Další vylepšení
      latency: 0,                   // Minimální latence
      volume: 1.0,                  // Maximální hlasitost
    } as MediaTrackConstraints,
    blobPropertyBag: {
      type: supportedMimeType,
    },
    mediaRecorderOptions: {
      mimeType: supportedMimeType,
      audioBitsPerSecond: 128000,   // Kvalita záznamu
    },
    onStop: (blobUrl: string, blob: Blob) => {
      console.log('🎵 Audio blob:', {
        size: blob.size,
        type: blob.type,
        settings: 'echo cancellation ON'
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
      {/* Indikátor kvality */}
      <div className="text-xs text-gray-400 mb-2 flex justify-center gap-2">
        <span>{supportedMimeType.includes('opus') ? '🎵 HQ' : '🎵 Standard'}</span>
        <span>🔊 Echo cancel</span>
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