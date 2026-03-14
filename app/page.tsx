'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRandomColor } from '@/hooks/useRandomColor';
import useSound from 'use-sound';
import Envelope from '@/components/Envelope';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const router = useRouter();
  const colors = useRandomColor();

  // 🎵 Zvuky
  const [playLand] = useSound('/sounds/envelope-land.mp3', { volume: 0.5 });
  const [playPulse] = useSound('/sounds/envelope-pulse.mp3', { 
    volume: 0.6,
    interrupt: true, // Přeruší předchozí při opakování
  });
  const [playOpen] = useSound('/sounds/envelope-open.mp3', { volume: 0.6 });
  const [playButtonClick] = useSound('/sounds/button-click.mp3', { volume: 0.4 });

  useEffect(() => {
    setMounted(true);
    
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = colors.bg;
      document.body.style.color = colors.text;
    }
  }, [colors]);

  const handleEnter = (e: React.MouseEvent) => {
    e.preventDefault();
    playButtonClick(); // 🎵 Kliknutí na tlačítko
    setShowEnvelope(true);
  };

  const openEnvelope = () => {
    setEnvelopeOpened(true);
    
    setTimeout(() => {
      router.push('/message');
    }, 800);
  };

  // Efekt pro přehrání zvuku při přilétnutí a pulzování
  useEffect(() => {
    if (showEnvelope && !envelopeOpened) {
      playLand(); // 🎵 Přilétnutí
      
      // Pulzování se zvukem každých 0.8s
      const pulseInterval = setInterval(() => {
        if (!envelopeOpened) {
          playPulse(); // 🎵 Pulzování
        }
      }, 800);
      
      return () => clearInterval(pulseInterval);
    }
  }, [showEnvelope, envelopeOpened, playLand, playPulse]);

  if (showEnvelope) {
    return (
      <div className="flex items-center justify-center h-screen relative overflow-hidden" style={{ backgroundColor: colors.bg, color: colors.text }}>
        {/* ✅ Envelope komponenta s onPlayOpen pro okamžitý zvuk */}
        <Envelope 
          onOpen={openEnvelope}
          onPlayOpen={playOpen}  // 🎵 TADY - zvuk se spustí hned při kliknutí na obálku
          envelopeOpened={envelopeOpened}
          accentColor={colors.accent}
          textColor={colors.text}
        />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-20 text-center"
        >
          <p style={{ color: colors.text }}>You've got mail.</p>
          <p style={{ color: colors.text, opacity: 0.7 }}>Mail for you.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 relative overflow-hidden" style={{ backgroundColor: colors.bg, color: colors.text }}>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full filter blur-3xl" style={{ backgroundColor: colors.accent }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full filter blur-3xl" style={{ backgroundColor: colors.accent }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10"
      >
        <h1 className="text-6xl md:text-7xl font-light mb-4 tracking-wide" style={{ color: colors.text }}>
          warmline
        </h1>
        
        <p className="text-xl mb-12 max-w-md mx-auto leading-relaxed" style={{ color: colors.text, opacity: 0.7 }}>
          anonymous messages that
          <br />
          <span style={{ color: colors.accent, fontWeight: 500 }}>brighten someone's day</span>
        </p>
        
        <div className="flex justify-center">
          <a
            href="#"
            onClick={handleEnter}
            className="group relative px-10 py-4 rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
            style={{ borderColor: colors.accent, borderWidth: '1px' }}
          >
            <span className="relative z-10 transition-colors duration-300 text-lg" style={{ color: colors.text }}>
              ✉️ Enter
            </span>
            <motion.div
              className="absolute inset-0"
              style={{ backgroundColor: colors.accent }}
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </a>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.2 }}
          className="text-xs mt-16"
          style={{ color: colors.text }}
        >
          every message makes a difference
        </motion.p>
      </motion.div>

      <div className="absolute bottom-8 left-8 text-4xl opacity-20" style={{ color: colors.accent }}>
        • • •
      </div>
      <div className="absolute top-8 right-8 text-4xl opacity-20" style={{ color: colors.accent }}>
        • • •
      </div>
    </div>
  );
}