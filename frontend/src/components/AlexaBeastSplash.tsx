import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Disc3 } from 'lucide-react';

interface AlexaBeastSplashProps {
  onComplete?: () => void;
}

export const AlexaBeastSplash: React.FC<AlexaBeastSplashProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Animate progress smoothly from 0 to 100 over 2.4 seconds
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsDismissed(true);
            if (onComplete) onComplete();
          }, 350);
          return 100;
        }
        return p + 2;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleManualSkip = () => {
    setIsDismissed(true);
    if (onComplete) onComplete();
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          key="alexa-beast-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070A11] text-white overflow-hidden select-none"
        >
          {/* Ambient Radial Glowing Orbs (Figma Glass Aesthetic) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-500/20 via-blue-600/15 to-purple-600/15 blur-[140px] pointer-events-none rounded-full" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-600/10 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />

          {/* Figma Cyber Grid Background lines */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(#00CAFF 1px, transparent 1px), linear-gradient(90deg, #00CAFF 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
            }}
          />

          {/* Central Animated Content */}
          <div className="relative z-10 max-w-2xl w-full px-6 flex flex-col items-center text-center space-y-8">
            {/* Top Figma Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111827]/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-widest uppercase shadow-[0_0_20px_rgba(0,202,255,0.2)] backdrop-blur-xl"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Figma UI/UX Design System • Next-Gen Multimodal</span>
            </motion.div>

            {/* Beast Orb & Pulsing Acoustic Rings */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: 'spring', stiffness: 120 }}
              className="relative flex items-center justify-center my-2"
            >
              {/* Outer Acoustic Waves */}
              {[1, 2, 3].map((ring, idx) => (
                <motion.div
                  key={ring}
                  animate={{
                    scale: [1, 1.45, 1],
                    opacity: [0.15, 0.45, 0.15],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    delay: idx * 0.45,
                    ease: 'easeInOut',
                  }}
                  className="absolute rounded-full border border-cyan-400/30"
                  style={{
                    width: `${120 + ring * 55}px`,
                    height: `${120 + ring * 55}px`,
                  }}
                />
              ))}

              {/* Central Metallic Core Ring */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 p-1 shadow-[0_0_50px_rgba(0,202,255,0.6)] animate-pulse">
                <div className="w-full h-full bg-[#070A11] rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-transparent to-blue-500/20" />
                  <Disc3 className="w-10 h-10 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
              </div>
            </motion.div>

            {/* --- BEAST FONT TYPOGRAPHY --- */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 30, letterSpacing: '0.1em' }}
                animate={{ opacity: 1, y: 0, letterSpacing: '0.28em' }}
                transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center"
              >
                <h1
                  className="text-7xl sm:text-8xl md:text-9xl font-black uppercase tracking-[0.25em] sm:tracking-[0.32em] font-mono select-none drop-shadow-[0_0_35px_rgba(0,202,255,0.7)] drop-shadow-[0_0_80px_rgba(0,85,255,0.4)]"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", "Impact", "Arial Black", sans-serif',
                    fontWeight: 900,
                  }}
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400">
                    ALEXA
                  </span>
                  <span className="text-cyan-400 inline-block drop-shadow-[0_0_25px_#00CAFF] animate-pulse">
                    +
                  </span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-xs sm:text-sm text-cyan-200/80 font-mono tracking-widest uppercase font-semibold"
              >
                Intelligent Multimodal Voice • Spotify Lossless Stream • Global Concierge
              </motion.p>
            </div>

            {/* Audio Equalizer Animated Bars (Figma Voice UI) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex items-end justify-center gap-1.5 h-8 w-44 mx-auto"
            >
              {[35, 75, 55, 95, 45, 100, 60, 85, 40, 70].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [`${h * 0.25}%`, `${h}%`, `${h * 0.3}%`],
                  }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    delay: i * 0.08,
                  }}
                  className="w-1.5 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-full shadow-[0_0_8px_#00CAFF]"
                />
              ))}
            </motion.div>

            {/* Sleek Neon Loading Progress Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="w-full max-w-sm space-y-2 pt-2"
            >
              <div className="w-full bg-gray-900/80 border border-gray-800 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 rounded-full shadow-[0_0_12px_#00CAFF]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 px-1">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Initializing Neural Interface...
                </span>
                <span className="text-cyan-400 font-bold">{progress}%</span>
              </div>
            </motion.div>

            {/* Skip / Enter Action */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="pt-2"
            >
              <button
                type="button"
                onClick={handleManualSkip}
                className="group flex items-center gap-2 px-5 py-2 rounded-2xl bg-[#111827]/70 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold transition-all active:scale-95"
              >
                <span>Enter Assistant</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};