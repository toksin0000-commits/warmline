'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micInfo, setMicInfo] = useState<string>('');
  const [filterEnabled, setFilterEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);

  const {
    status,
    startRecording: originalStartRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl
  } = useReactMediaRecorder({
    audio: true, // Necháme knihovnu, aby si vyžádala stream
    onStop: (blobUrl: string, blob: Blob) => {
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
      console.log('🎵 Recording with filter:', {
        size: sizeMB + 'MB',
        filter: filterEnabled ? 'High-pass 800Hz' : 'Disabled'
      });
      setAudioBlob(blob);
      onRecordingComplete(blob);
    }
  });

  // Inicializace mikrofonu a filtru
  useEffect(() => {
    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 96000,
            channelCount: 2,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          }
        });

        const track = stream.getAudioTracks()[0];
        const settings = track.getSettings();
        
        setMicInfo(`${settings.sampleRate || 48000}Hz · Voice Optimized`);
        
        // Vytvoříme AudioContext a filtr pro monitoring
        const audioContext = new AudioContext({
          sampleRate: 96000,
          latencyHint: 'interactive'
        });
        
        audioContextRef.current = audioContext;
        
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        
        // High-pass filter na 800 Hz
        const filter = audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.7;
        filterRef.current = filter;
        
        // Zapojíme filtr pouze pro monitoring (slyšíš filtrovaný zvuk)
        source.connect(filter);
        filter.connect(audioContext.destination);
        
        // Stream necháme otevřený pro knihovnu
        setMicReady(true);
        
      } catch (err) {
        console.error('Microphone error:', err);
      }
    };

    setupAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
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
    originalStartRecording();
  };

  const resetRecording = (): void => {
    setAudioBlob(null);
    clearBlobUrl();
  };

  const toggleFilter = () => {
    if (filterRef.current && audioContextRef.current) {
      if (filterEnabled) {
        // Vypneme filtr - zapojíme source přímo do destination
        sourceRef.current?.disconnect();
        sourceRef.current?.connect(audioContextRef.current.destination);
      } else {
        // Zapneme filtr
        sourceRef.current?.disconnect();
        sourceRef.current?.connect(filterRef.current);
        filterRef.current?.connect(audioContextRef.current.destination);
      }
      setFilterEnabled(!filterEnabled);
    }
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
        <span>{micInfo || 'Initializing microphone...'}</span>
        <button 
          onClick={toggleFilter}
          className={`px-2 py-1 rounded ${filterEnabled ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
        >
          {filterEnabled ? 'Filter ON' : 'Filter OFF'}
        </button>
      </div>

      {status === 'recording' ? (
        <div className="space-y-6">
          {/* Timer with progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-black">Recording...</span>
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
          {micReady ? 'Start Recording' : 'Preparing microphone...'}
        </button>
      )}
    </div>
  );
}