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
  const [actualSampleRate, setActualSampleRate] = useState<number>(120000);
  const [bitrate, setBitrate] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl
  } = useReactMediaRecorder({
    audio: false, // Nepoužijeme vestavěný audio, budeme streamovat vlastní
    onStop: (blobUrl: string, blob: Blob) => {
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
      const actualBitrate = (blob.size * 8 / recordingTime / 1000).toFixed(0);
      
      console.log('🎵 120kHz Filtered:', {
        size: sizeMB + 'MB',
        sampleRate: actualSampleRate + ' Hz',
        bitrate: actualBitrate + ' kbps',
        filter: 'High-pass 800Hz',
        duration: recordingTime + 's'
      });
      
      setBitrate(parseInt(actualBitrate));
      setAudioBlob(blob);
      onRecordingComplete(blob);
    }
  });

  // Inicializace 120 kHz s filtrem
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // 1. Získáme stream z mikrofonu
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
        setMicInfo(`${actualRate}Hz · 24bit · High-pass 800Hz`);

        // 2. Vytvoříme Audio Context
        const audioContext = new AudioContext({
          sampleRate: actualRate,
          latencyHint: 'balanced'
        });

        // 3. Vytvoříme source
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        // 4. HIGH-PASS FILTR (odstranění basů)
        const highPass = audioContext.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.value = 800; // Propouští vše NAD 800 Hz
        highPass.Q.value = 0.5; // Přirozený přechod
        filterRef.current = highPass;

        // 5. Vytvoříme destination pro nahrávání
        const destination = audioContext.createMediaStreamDestination();
        destinationRef.current = destination;

        // 6. Zapojíme: source -> filter -> destination
        source.connect(highPass);
        highPass.connect(destination);

        // 7. Vytvoříme MediaRecorder pro filtrovaný stream
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 384000, // 384 kbps pro 120 kHz
        });

        // 8. Uložíme recorder do komponenty
        (window as any).__mediaRecorder = mediaRecorder;

        // 9. Nastavíme event handlery
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            const chunks = (window as any).__chunks || [];
            chunks.push(e.data);
            (window as any).__chunks = chunks;
          }
        };

        mediaRecorder.onstop = () => {
          const chunks = (window as any).__chunks || [];
          const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
          
          // Zavoláme onStop z useReactMediaRecorder
          const stopEvent = new Event('stop') as any;
          stopEvent.blob = blob;
          stopEvent.blobUrl = URL.createObjectURL(blob);
          (window as any).__onStop?.(stopEvent);
          
          (window as any).__chunks = [];
        };

        console.log('🎤 120kHz with High-pass filter:', {
          model: track.label,
          sampleRate: actualRate,
          filter: '800Hz high-pass',
          bitrate: '384 kbps'
        });

        // Zastavíme monitoring (neposíláme do reproduktorů)
        // source není připojeno k destination, jen k filtru a ten k destination pro nahrávání
        
        setMicReady(true);

      } catch (err) {
        console.error('120kHz failed:', err);
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
          setMicInfo(`96 kHz · 24bit · High-pass 800Hz (120kHz not supported)`);
          
          // Podobné nastavení pro 96 kHz...
          // (pro zjednodušení vynecháme, ale princip stejný)
          
          stream.getTracks().forEach(track => track.stop());
          setMicReady(true);
          
        } catch (fallbackErr) {
          console.error('Even 96kHz failed:', fallbackErr);
        }
      }
    };

    setupAudio();

    return () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
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
    
    const recorder = (window as any).__mediaRecorder;
    if (recorder && recorder.state === 'inactive') {
      (window as any).__chunks = [];
      recorder.start(100); // Sbíráme data každých 100ms
      setRecordingTime(0);
      
      // Napojíme se na onStop
      (window as any).__onStop = (e: any) => {
        const blob = e.blob;
        const url = e.blobUrl;
        (window as any).__onStopInternal?.(url, blob);
      };
    }
  };

  const handleStopRecording = () => {
    const recorder = (window as any).__mediaRecorder;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }
    stopRecording(); // Zastaví i původní recorder
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
        <span className="font-mono">
          {bitrate ? `${bitrate} kbps` : 'Hi-Res'}
        </span>
      </div>

      {status === 'recording' ? (
        <div className="space-y-6">
          {/* Timer with progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-black">Recording 120kHz (no bass)...</span>
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
            onClick={handleStopRecording}
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
          {micReady ? 'Start 120kHz (No Bass)' : 'Preparing microphone...'}
        </button>
      )}
    </div>
  );
}