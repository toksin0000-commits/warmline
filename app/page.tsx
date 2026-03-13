'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnter = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowEnvelope(true);
  };

  const openEnvelope = () => {
    setEnvelopeOpened(true);
    
    setTimeout(() => {
      router.push('/message');
    }, 800);
  };

  // Pokud se má zobrazit obálka, ukážeme ji přes celou obrazovku
  if (showEnvelope) {
    return (
      <div className="flex items-center justify-center h-screen bg-white relative overflow-hidden">
        {/* Přilétací obálka */}
        <motion.div
          initial={{ y: -500, scale: 0.2, opacity: 0, rotate: -10 }}
          animate={{ 
            y: 0, 
            scale: 1, 
            opacity: 1, 
            rotate: 0,
            transition: { duration: 1.4, ease: "easeOut" }
          }}
          className="cursor-pointer"
          onClick={openEnvelope}
        >
          <motion.div
            animate={{
              scale: envelopeOpened ? 1 : [1, 1.06, 1], // Rychlejší pulzování
            }}
            transition={{
              duration: envelopeOpened ? 0.2 : 0.8, // Rychlejší pulzování (0.8s místo 2.4s)
              repeat: envelopeOpened ? 0 : Infinity,
              ease: "easeInOut"
            }}
            className="relative w-[220px] h-[140px] border border-black rounded-lg bg-white overflow-hidden"
          >
            {/* Flap (chlopeň) */}
            <motion.div
              initial={{ rotateX: 0 }}
              animate={{ rotateX: envelopeOpened ? -180 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute top-0 left-0 right-0 h-1/2 border-b border-black origin-top bg-white"
            />

            {/* Note inside (vzkaz uvnitř) */}
            {envelopeOpened && (
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center bg-white"
              >
                <p className="text-sm text-black">Someone sent you this…</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Text pod obálkou */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-20 text-center"
        >
          <p className="text-black">You've got mail.</p>
          <p className="text-black">Mail for you.</p>
        </motion.div>
      </div>
    );
  }

  // Původní vstupní stránka (bez tlačítka Leave)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 relative overflow-hidden">
      {/* Jemné pozadí pro atmosféru */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-black rounded-full filter blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-black rounded-full filter blur-3xl" />
      </div>

      {/* Hlavní obsah s animací */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10"
      >
        {/* Název */}
        <h1 className="text-6xl md:text-7xl font-light text-black mb-4 tracking-wide">
          warmline
        </h1>
        
        {/* Popis */}
        <p className="text-gray-500 text-xl mb-12 max-w-md mx-auto leading-relaxed">
          anonymous messages that
          <br />
          <span className="text-black font-medium">brighten someone's day</span>
        </p>
        
        {/* Pouze tlačítko Enter - Leave odstraněno */}
        <div className="flex justify-center">
          <a
            href="#"
            onClick={handleEnter}
            className="group relative px-10 py-4 border border-black rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
          >
            <span className="relative z-10 text-black group-hover:text-white transition-colors duration-300 text-lg">
              ✉️ Enter
            </span>
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </a>
        </div>

        {/* Počet zpráv (můžeš doplnit) */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.2 }}
          className="text-xs text-gray-400 mt-16"
        >
          every message makes a difference
        </motion.p>
      </motion.div>

      {/* Dekorativní tečky */}
      <div className="absolute bottom-8 left-8 text-gray-200 text-4xl opacity-20">
        • • •
      </div>
      <div className="absolute top-8 right-8 text-gray-200 text-4xl opacity-20">
        • • •
      </div>
    </div>
  );
}