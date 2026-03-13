'use client';

import { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [micInfo, setMicInfo] = useState<{
    label: string;
    maxSampleRate: number;
    supported: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Zjistíme, co mikrofon umí
    navigator.mediaDevices.getUserMedia({ 
      audio: {
        sampleRate: 120000, // Požádáme o maximum
        channelCount: 2,
        sampleSize: 24,
      } 
    })
    .then(stream => {
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();
      
      setMicInfo({
        label: track.label,
        maxSampleRate: settings.sampleRate || 48000,
        supported: true
      });
      
      console.log('🎤 Mikrofon:', {
        model: track.label,
        sampleRate: settings.sampleRate,
        channels: settings.channelCount,
        sampleSize: settings.sampleSize
      });
      
      stream.getTracks().forEach(track => track.stop());
    })
    .catch(err => {
      console.error('Mikrofon error:', err);
      setError('Mikrofon není k dispozici');
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
      // Požádáme o maximum, prohlížeč dá co může
      sampleRate: 120000,
      sampleSize: 24,
      channelCount: 2,
      
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    } as MediaTrackConstraints,
    
    blobPropertyBag: {
      type: 'audio/wav', // Nekomprimovaný WAV
    },
    
    onStop: (blobUrl: string, blob: Blob) => {
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
      const sampleRate = micInfo?.maxSampleRate || 48000;
      
      console.log('🎵 Ultra kvalita:', {
        velikost: sizeMB + ' MB',
        sampleRate: sampleRate + ' Hz',
        limit: '4.5 MB',
        vlimitu: parseFloat(sizeMB) < 4.5 ? '✅ Ano' : '❌ Ne'
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
    if (!micInfo?.supported) {
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

  if (error) {
    return (
      <div className="border border-red-300 rounded-xl p-8 w-full max-w-md text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="border border-black rounded-xl p-8 w-full max-w-md text-center">
      <div className="text-xs text-gray-400 mb-2 space-y-1">
        <div className="flex justify-center gap-3">
          <span className={micInfo ? 'text-green-600' : 'text-yellow-600'}>
            {micInfo ? '🎤 ' + micInfo.label : '⏳ Kontrola mikrofonu...'}
          </span>
        </div>
        {micInfo && (
          <div className="flex justify-center gap-3 text-gray-500">
            <span>{micInfo.maxSampleRate} Hz</span>
            <span>24-bit</span>
            <span>Stereo</span>
          </div>
        )}
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
          disabled={!micInfo}
          className="border border-black rounded-full px-8 py-3 text-black hover:bg-black hover:text-white transition-colors disabled:opacity-40"
        >
          Nahrát zprávu
        </button>
      )}
    </div>
  );
}