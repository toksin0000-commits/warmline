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
    // Zkontrolujeme, co mikrofon umí
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const track = stream.getAudioTracks()[0];
        const capabilities = track.getCapabilities?.() || {};
        const settings = track.getSettings();
        
        console.log('🎤 Mikrofon:', {
          label: track.label,
          capabilities: {
            sampleRate: capabilities.sampleRate,
            channelCount: capabilities.channelCount,
          },
          current: {
            sampleRate: settings.sampleRate,
            channelCount: settings.channelCount,
          }
        });
        
        stream.getTracks().forEach(track => track.stop());
        setMicReady(true);
      })
      .catch(err => {
        console.error('Mikrofon error:', err);
      });
  }, []);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl
  } = useReactMediaRecorder({
    audio: {
      // NEJVYŠŠÍ MOŽNÁ KVALITA
      sampleRate: 96000,           // 96 kHz - studiová kvalita
      channelCount: 2,              // Stereo pro větší prostor
      
      // VŠECHNO VYPNUTO - žádné úpravy
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      
      // Další parametry pro maximální kvalitu
      latency: 0,
      volume: 1.0,
    } as MediaTrackConstraints,
    
    // NEJLEPŠÍ FORMÁT
    blobPropertyBag: {
      type: 'audio/webm;codecs=pcm', // Pokus o PCM (nekomprimovaný)
    },
    
    mediaRecorderOptions: {
      mimeType: 'audio/webm;codecs=pcm',
      audioBitsPerSecond: 1536000,    // 96kHz * 16bit = 1.5 Mbps
    },
    
    onStop: (blobUrl: string, blob: Blob) => {
      console.log('🎵 HI-RES Audio:', {
        size: (blob.size / 1024 / 1024).toFixed(2) + ' MB',
        type: blob.type,
        bitrate: (blob.size * 8 / 5 / 1000).toFixed(0) + ' kbps',
        frequency: '96 kHz',
        channels: 'Stereo'
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
        <span className={micReady ? 'text-green-600' : 'text-red-600'}>
          {micReady ? '🎤 Mikrofon OK' : '⏳ Kontrola mikrofonu...'}
        </span>
        <span>96 kHz Stereo</span>
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
          disabled={!micReady}
          className="border border-black rounded-full px-8 py-3 text-black hover:bg-black hover:text-white transition-colors disabled:opacity-40"
        >
          Start Recording
        </button>
      )}
    </div>
  );
}