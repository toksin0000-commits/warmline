'use client';

import { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micInfo, setMicInfo] = useState<string>('');
  const [actualSampleRate, setActualSampleRate] = useState<number>(120000);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl
  } = useReactMediaRecorder({
    audio: {
      // Požadujeme 120 kHz
      sampleRate: 120000,
      channelCount: 2,
      sampleSize: 24,
      
      // Žádné úpravy - čistý signál
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    } as MediaTrackConstraints,
    
    blobPropertyBag: {
      type: 'audio/webm;codecs=opus',
    },
    
    mediaRecorderOptions: {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 384000, // 384 kbps pro 120 kHz
    },
    
    onStop: (blobUrl: string, blob: Blob) => {
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
      console.log('🎵 120kHz Recording:', {
        size: sizeMB + 'MB',
        sampleRate: actualSampleRate + ' Hz',
        bitrate: (blob.size * 8 / 5 / 1000).toFixed(0) + ' kbps'
      });
      
      setAudioBlob(blob);
      onRecordingComplete(blob);
    }
  });

  // Jen zjistíme, co mikrofon umí - ŽÁDNÝ MONITORING
  useEffect(() => {
    const checkMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 120000,
            channelCount: 2,
            sampleSize: 24,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          }
        });

        const track = stream.getAudioTracks()[0];
        const settings = track.getSettings();
        const actualRate = settings.sampleRate || 120000;
        
        setActualSampleRate(actualRate);
        setMicInfo(`${actualRate}Hz · 24bit · Studio Quality`);
        
        console.log('🎤 120kHz Microphone ready:', {
          model: track.label,
          sampleRate: actualRate,
          bits: settings.sampleSize || 24
        });
        
        // OKAMŽITĚ zastavíme - ŽÁDNÝ MONITORING
        stream.getTracks().forEach(track => track.stop());
        setMicReady(true);
        
      } catch (err) {
        console.error('120kHz not supported, trying 96kHz...');
        
        // Fallback na 96 kHz
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: 96000,
              channelCount: 2,
              sampleSize: 24,
            }
          });
          
          const track = stream.getAudioTracks()[0];
          const settings = track.getSettings();
          setActualSampleRate(96000);
          setMicInfo(`96 kHz · High Quality (120 kHz not supported)`);
          
          stream.getTracks().forEach(track => track.stop());
          setMicReady(true);
          
        } catch (fallbackErr) {
          console.error('Even 96kHz failed:', fallbackErr);
        }
      }
    };

    checkMicrophone();
  }, []);

  // Timer pro odpočítávání
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'recording') {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 8) {
            stopRecording();
            return 8;
          }
          return newTime;
        });
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [status, stopRecording]);

  const handleStartRecording = () => {
    if (!micReady) return;
    setRecordingTime(0);
    startRecording();
  };

  const resetRecording = (): void => {
    setAudioBlob(null);
    clearBlobUrl();
  };

  const formatTime = (seconds: number): string => {
    return `${seconds}s / 8s`;
  };

  const getProgressPercentage = (): number => {
    return (recordingTime / 8) * 100;
  };

  return (
    <div className="border border-black rounded-xl p-8 w-full max-w-md">
      {/* Status bar */}
      <div className="flex justify-between items-center mb-4 text-xs text-gray-500">
        <span>{micInfo || 'Initializing 120kHz microphone...'}</span>
        <span className="font-mono">Hi-Res Audio</span>
      </div>

      {status === 'recording' ? (
        <div className="space-y-6">
          {/* Timer with progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-black">Recording 120kHz...</span>
              <span className="font-mono text-black">{formatTime(recordingTime)}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black transition-all duration-200"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
          
          <button
            onClick={stopRecording}
            className="w-full border border-black rounded-full px-6 py-3 text-black hover:bg-black hover:text-white transition-colors"
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
              className="flex-1 border border-black rounded-full px-4 py-2 text-sm text-black hover:bg-black hover:text-white transition-colors"
            >
              Record Again
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleStartRecording}
          disabled={!micReady}
          className="w-full border border-black rounded-full px-8 py-3 text-black hover:bg-black hover:text-white transition-colors disabled:opacity-40"
        >
          {micReady ? 'Start 120kHz Recording' : 'Preparing microphone...'}
        </button>
      )}
    </div>
  );
}