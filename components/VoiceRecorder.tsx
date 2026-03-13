'use client';

import { useState, useRef } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      // 1. Získáme stream z mikrofonu - POUZE PRO NAHRÁVÁNÍ
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 120000,     // 120 kHz
          channelCount: 2,         // Stereo
          sampleSize: 24,          // 24-bit
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      streamRef.current = stream;
      
      // 2. Vytvoříme MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 384000  // 384 kbps pro 120 kHz
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      // 3. Ukládáme data
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      // 4. Po zastavení vytvoříme blob a pošleme ho dál
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        
        setAudioUrl(url);
        onRecordingComplete(blob);
        
        // Zastavíme stream - KOMPLETNĚ, ŽÁDNÝ MONITORING
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      // 5. Spustíme nahrávání
      mediaRecorder.start(100);
      setIsRecording(true);
      
      // 6. Timer pro odpočítávání
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 7) { // 8 sekund? Zastavíme
            stopRecording();
            return 8;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error('Chyba mikrofonu:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const formatTime = (seconds: number): string => {
    return `${seconds}s / 8s`;
  };

  // Výpočet bitrate po nahrání
  const getBitrate = (): number => {
    if (audioUrl && chunksRef.current.length > 0) {
      const totalSize = chunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
      return Math.round(totalSize * 8 / 5 / 1000); // kbps pro 5s
    }
    return 0;
  };

  return (
    <div className="border border-black rounded-xl p-8 w-full max-w-md text-center">
      {/* Status bar - ŽÁDNÝ MONITORING */}
      <div className="text-xs text-gray-400 mb-4">
        {isRecording ? '🔴 Recording 120kHz' : '🎤 120kHz Ready'}
        {audioUrl && !isRecording && ` · ${getBitrate()} kbps`}
      </div>

      {isRecording ? (
        <div className="space-y-4">
          <div className="text-black font-mono text-xl">
            {formatTime(recordingTime)}
          </div>
          <button
            onClick={stopRecording}
            className="border border-black rounded-full px-8 py-3 text-black hover:bg-black hover:text-white transition-colors"
          >
            Stop Recording
          </button>
        </div>
      ) : audioUrl ? (
        <div className="space-y-4">
          <audio src={audioUrl} controls className="w-full" />
          <button
            onClick={resetRecording}
            className="border border-black rounded-full px-8 py-3 text-black hover:bg-black hover:text-white transition-colors"
          >
            Record Again
          </button>
        </div>
      ) : (
        <button
          onClick={startRecording}
          className="border border-black rounded-full px-8 py-3 text-black hover:bg-black hover:text-white transition-colors"
        >
          Start 120kHz Recording
        </button>
      )}
    </div>
  );
}