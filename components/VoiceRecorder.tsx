'use client';

import { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [micReady, setMicReady] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const track = stream.getAudioTracks()[0];
        console.log('🎤 Mikrofon:', track.label);
        stream.getTracks().forEach(track => track.stop());
        setMicReady(true);
      })
      .catch(err => console.error('Mikrofon error:', err));
  }, []);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl
  } = useReactMediaRecorder({
    audio: {
      // VYSOKÝ VZORKOVACÍ KMITOČET pro výšky
      sampleRate: 96000,           // 96 kHz - zachytí všechny výšky
      channelCount: 2,              // Stereo pro prostor
      
      echoCancellation: true,
      noiseSuppression: false,
      autoGainControl: false,
    } as MediaTrackConstraints,
    
    // Použijeme OPUS, který umí dobře komprimovat i vysoké frekvence
    blobPropertyBag: {
      type: 'audio/webm;codecs=opus',
    },
    
    mediaRecorderOptions: {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 256000,    // 256 kbps - kompromis
    },
    
    onStop: (blobUrl: string, blob: Blob) => {
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
      console.log('🎵 96 kHz komprimováno:', {
        size: sizeMB + ' MB',
        bitrate: '256 kbps',
        sampleRate: '96 kHz',
        kvalita: 'Vysoké výšky zachovány'
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
    if (!micReady) {
      alert('Mikrofon není připraven');
      return;
    }
    startRecording();
    setTimeout(() => {
      if (status === 'recording') {
        stopRecording();
      }
    }, 5000);
  };

  return (
    <div className="border border-black rounded-xl p-8 w-full max-w-md text-center">
      <div className="text-xs text-gray-400 mb-2 flex justify-center gap-3">
        <span>96 kHz Stereo</span>
        <span>256 kbps</span>
        <span>~1.5 MB</span>
      </div>

      {status === 'recording' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="animate-pulse text-red-500">🔴</span>
            <span className="text-black">Nahrávání... (max 5 vteřin)</span>
          </div>
          <button
            onClick={stopRecording}
            className="border border-black rounded-full px-6 py-2 text-black hover:bg-black hover:text-white transition-colors"
          >
            Stop
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
              Nahrát znovu
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleStartRecording}
          disabled={!micReady}
          className="border border-black rounded-full px-8 py-3 text-black hover:bg-black hover:text-white transition-colors disabled:opacity-40"
        >
          Nahrát zprávu
        </button>
      )}
    </div>
  );
}