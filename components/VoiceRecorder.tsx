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
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Inicializace audio kontextu a filtrů
  const initAudioWithFilter = async () => {
    try {
      // Zastavíme předchozí stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Získáme stream z mikrofonu
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 96000,
          channelCount: 2,
          sampleSize: 24,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      mediaStreamRef.current = stream;
      
      // Vytvoříme AudioContext
      const audioContext = new AudioContext({
        sampleRate: 96000,
        latencyHint: 'interactive'
      });
      
      audioContextRef.current = audioContext;
      
      // Vytvoříme zdroj ze streamu
      const source = audioContext.createMediaStreamSource(stream);
      
      // HIGH-PASS FILTER (odstranění basů)
      // Frekvence pod 800 Hz budou zeslabeny (necháváme středy a výšky)
      const highPassFilter = audioContext.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.value = 800; // Hraniční frekvence
      highPassFilter.Q.value = 0.7; // Mírný náběh, přirozený zvuk
      
      // Volitelně můžeme přidat i lehký low-pass pro odstranění šumu (ale necháme výšky)
      // const lowPassFilter = audioContext.createBiquadFilter();
      // lowPassFilter.type = 'lowpass';
      // lowPassFilter.frequency.value = 12000; // Propustí vše do 12 kHz
      
      // Propojíme: source -> highPassFilter -> destination (pro monitoring)
      source.connect(highPassFilter);
      highPassFilter.connect(audioContext.destination);
      
      // Vytvoříme MediaStreamDestination pro nahrávání
      const destination = audioContext.createMediaStreamDestination();
      highPassFilter.connect(destination);
      
      // MediaRecorder pro upravený stream
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 320000,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
        
        console.log('🎵 Filtered recording:', {
          size: sizeMB + 'MB',
          filter: 'High-pass 800 Hz',
          frequencies: 'Mids & Highs preserved'
        });
        
        setAudioBlob(blob);
        onRecordingComplete(blob);
        
        // Vyčistíme
        chunksRef.current = [];
      };
      
      setMicInfo(`${stream.getAudioTracks()[0].getSettings().sampleRate}Hz · Voice Optimized`);
      setMicReady(true);
      
    } catch (err) {
      console.error('Audio setup error:', err);
    }
  };

  // Inicializace při načtení
  useEffect(() => {
    initAudioWithFilter();
    
    return () => {
      // Cleanup
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Timer pro odpočítávání
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mediaRecorderRef.current?.state === 'recording') {
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
  }, [mediaRecorderRef.current?.state]);

  const startRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'recording') return;
    
    chunksRef.current = [];
    mediaRecorderRef.current.start(100); // Sbíráme data každých 100ms
    setRecordingTime(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const resetRecording = (): void => {
    setAudioBlob(null);
    chunksRef.current = [];
  };

  const handleStartRecording = () => {
    if (!micReady) return;
    startRecording();
  };

  const formatTime = (seconds: number): string => {
    return `${seconds}s / 8s`;
  };

  const getProgressPercentage = (): number => {
    return (recordingTime / 8) * 100;
  };

  const isRecording = mediaRecorderRef.current?.state === 'recording';

  return (
    <div className="border border-black rounded-xl p-8 w-full max-w-md">
      {/* Status bar */}
      <div className="flex justify-between items-center mb-4 text-xs text-gray-500">
        <span>{micInfo || 'Initializing microphone...'}</span>
        <span className="font-mono">Voice Optimized</span>
      </div>

      {isRecording ? (
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
      ) : audioBlob ? (
        <div className="space-y-4">
          <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
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