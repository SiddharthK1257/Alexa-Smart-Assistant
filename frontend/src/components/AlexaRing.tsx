import React from 'react';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';

interface AlexaRingProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking';
  onToggleMic: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const AlexaRing: React.FC<AlexaRingProps> = ({
  state,
  onToggleMic,
  isMuted,
  onToggleMute,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
  }[size];

  const ringStyles = {
    idle: 'border-cyan-500/30 shadow-[0_0_30px_rgba(0,202,255,0.15)]',
    listening: 'border-cyan-400 shadow-[0_0_50px_rgba(0,255,234,0.6)] animate-pulse',
    processing: 'border-purple-500 shadow-[0_0_60px_rgba(139,92,246,0.6)] animate-spin',
    speaking: 'border-blue-400 shadow-[0_0_50px_rgba(0,85,255,0.6)] animate-pulse',
  }[state];

  const glowColors = {
    idle: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    listening: 'from-cyan-400/40 via-blue-500/30 to-purple-500/20',
    processing: 'from-purple-500/40 via-blue-600/30 to-cyan-500/20',
    speaking: 'from-blue-500/40 via-cyan-400/30 to-indigo-500/20',
  }[state];

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      <div className="relative flex items-center justify-center">
        {/* Outer Aura Glow */}
        <div
          className={`absolute rounded-full transition-all duration-700 blur-2xl ${sizeClasses} bg-gradient-to-tr ${glowColors}`}
        />

        {/* Outer Animated Ring */}
        <div
          className={`relative rounded-full border-2 transition-all duration-500 flex items-center justify-center ${sizeClasses} ${ringStyles}`}
        >
          {/* Inner Interactive Sphere Button */}
          <button
            onClick={onToggleMic}
            title={state === 'listening' ? 'Click to stop listening' : 'Click to speak to Alexa+'}
            className="w-4/5 h-4/5 rounded-full bg-gradient-to-b from-[#111827] to-[#0B0F19] border border-cyan-500/40 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 hover:border-cyan-400 group cursor-pointer shadow-inner"
          >
            {state === 'listening' ? (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <span
                    key={i}
                    className="w-1 bg-cyan-400 rounded-full animate-waveform"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                      height: '24px',
                    }}
                  />
                ))}
              </div>
            ) : state === 'processing' ? (
              <Sparkles className="w-8 h-8 text-purple-400 animate-spin" />
            ) : state === 'speaking' ? (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map(i => (
                  <span
                    key={i}
                    className="w-1 bg-blue-400 rounded-full animate-pulse"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      height: `${14 + (i % 3) * 8}px`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <Mic className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
            )}

            <span className="text-[11px] font-medium tracking-wider uppercase text-cyan-300/80">
              {state === 'listening'
                ? 'Listening...'
                : state === 'processing'
                ? 'Thinking...'
                : state === 'speaking'
                ? 'Speaking'
                : 'Tap to Speak'}
            </span>
          </button>
        </div>
      </div>

      {/* Control Pills below Ring */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onToggleMic}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all ${
            state === 'listening'
              ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse'
              : 'bg-[#1F2937]/70 border-gray-700 text-gray-300 hover:border-cyan-500/50 hover:text-cyan-300'
          }`}
        >
          {state === 'listening' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{state === 'listening' ? 'Stop Listening' : 'Voice Input'}</span>
        </button>

        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all ${
              isMuted
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#1F2937]/70 border-gray-700 text-gray-300 hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
          >
            <Volume2 className={`w-3.5 h-3.5 ${isMuted ? 'line-through text-amber-400' : 'text-cyan-400'}`} />
            <span>{isMuted ? 'Voice Muted' : 'Voice Active'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
