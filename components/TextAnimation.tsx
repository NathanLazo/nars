"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AnimatedText() {
  const phrases = ["por siempre", "para siempre", "contigo"];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, 3000); // Change text every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className='absolute inset-0 flex items-center justify-center pointer-events-none z-10'>
      <AnimatePresence mode='wait'>
        <motion.h1
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8 }}
          className='text-5xl md:text-7xl font-bold text-blue-800 tracking-wider'
        >
          {phrases[currentIndex]}
        </motion.h1>
      </AnimatePresence>
    </div>
  );
}
