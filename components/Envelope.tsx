'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface EnvelopeProps {
  onOpen: () => void;
  onPlayOpen?: () => void;  // ✅ Přidáno pro zvuk
  envelopeOpened?: boolean;
  accentColor?: string;
  textColor?: string;
}

export default function Envelope({ onOpen, onPlayOpen }: EnvelopeProps) {
  const [opened, setOpened] = useState(false);

  const handleClick = () => {
    if (onPlayOpen) onPlayOpen(); // 🎵 Zvuk HNED při kliknutí
    setOpened(true);
    setTimeout(() => {
      onOpen();
    }, 900);
  };

  return (
    <motion.div
      initial={{ y: -200, scale: 0.3, opacity: 0, rotate: -3 }}
      animate={{
        y: 0,
        scale: 1,
        opacity: 1,
        rotate: 0,
        transition: { duration: 2.4, ease: 'easeOut' }
      }}
      className="cursor-pointer"
      onClick={handleClick}
    >
      <motion.div
        animate={{
          scale: opened ? 1 : [1, 1.08, 1], // ⚡ Rychlejší pulzování (1.08 místo 1.02)
        }}
        transition={{
          duration: opened ? 0.2 : 0.7,      // ⚡ Rychlejší (0.6s místo 2.0s)
          repeat: opened ? 0 : Infinity,
          ease: 'easeInOut'
        }}
        className="relative w-[240px] h-[160px]"
      >
        {/* 💌 HLAVNÍ OBÁLKA (modré orámování) */}
        <motion.div
          className="absolute inset-0 bg-white rounded-lg shadow-lg"
          style={{
            border: '3px solid #3b82f6',      // Modrý rámeček
            boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 4px 8px rgba(0,59,130,0.2)',
          }}
        />

        {/* Chlopeň obálky (horní trojúhelník) */}
        <motion.div
          initial={{ rotateX: 0 }}
          animate={{ rotateX: opened ? -180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute top-0 left-0 right-0 h-1/2 origin-top"
          style={{
            background: 'white',
            borderBottom: '2px solid #3b82f6',
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
          }}
        />

        {/* ❤️ SRDÍČKO (místo pečeti) */}
        {!opened && (
          <motion.div
            className="absolute left-1/2 top-1/2 text-4xl"
            style={{
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              scale: [1, 1.15, 1],           // Srdíčko také lehce pulzuje
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ❤️
          </motion.div>
        )}

        {/* 📜 TEXT UVNITŘ (po otevření) */}
        <AnimatePresence>
          {opened && (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center p-4">
                <p className="text-sm text-gray-700">
                  "Someone sent you this…"
                </p>
                <div className="flex justify-center gap-1 mt-2">
                  <span className="text-xs text-blue-500">✧</span>
                  <span className="text-xs text-blue-500">✧</span>
                  <span className="text-xs text-blue-500">✧</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dekorativní rohy (modré) */}
        <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
        <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
        <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
        <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
      </motion.div>
    </motion.div>
  );
}