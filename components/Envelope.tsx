'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Envelope({ onOpen }: { onOpen: () => void }) {
  const [opened, setOpened] = useState(false);

  const handleClick = () => {
    setOpened(true);

    // After a short animation, move to the next page
    setTimeout(() => {
      onOpen();
    }, 900);
  };

  return (
    <motion.div
      initial={{ y: -200, scale: 0.3, opacity: 0, rotate: -5 }}
      animate={{
        y: 0,
        scale: 1,
        opacity: 1,
        rotate: 0,
        transition: { duration: 1.4, ease: 'easeOut' }
      }}
      className="cursor-pointer"
      onClick={handleClick}
    >
      <motion.div
        animate={{
          scale: opened ? 1 : [1, 1.04, 1],
        }}
        transition={{
          duration: opened ? 0.2 : 2.4,
          repeat: opened ? 0 : Infinity,
          ease: 'easeInOut'
        }}
        className="relative w-[220px] h-[140px] border border-black rounded-lg bg-white overflow-hidden"
      >
        {/* Flap */}
        <motion.div
          initial={{ rotateX: 0 }}
          animate={{ rotateX: opened ? -180 : 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute top-0 left-0 right-0 h-1/2 border-b border-black origin-top bg-white"
        />

        {/* Note */}
        <AnimatePresence>
          {opened && (
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-center bg-white"
            >
              <p className="text-sm text-black">Someone sent you this…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
