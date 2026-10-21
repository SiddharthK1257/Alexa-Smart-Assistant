import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Wrench,
  ShieldAlert,
  AlertCircle,
  Square,
  RefreshCw,
} from 'lucide-react';

export type VoiceAssistantState =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'processing'
  | 'executing_tool'
  | 'speaking'
  | 'error';

interface AlexaRingProps {
  state: VoiceAssistantState;
  onToggleMic: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onStopSpeaking?: () => void;
  onRetry?: () => void;
  currentToolName?: string;
  errorMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AlexaRing: React.FC<AlexaRingProps> = ({
  state,
  onToggleMic,
  isMuted,
  onToggleMute,
  onStopSpeaking,
  onRetry,
  currentToolName,
  errorMessage,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
  }[size];

  const ringStyles: Record<VoiceAssistantState, string> = {
    idle: 'border-cyan-500/30 shadow-[0_0_30px_rgba(0,202,255,0.15)]',
    requesting_permission: 'border-amber-400 shadow-[0_0_45px_rgba(251,191,36,0.5)] animate-pulse',
    listening: 'border-cyan-400 shadow-[0_0_55px_rgba(0,255,234,0.65)] animate-pulse',
    processing: 'border-purple-500 shadow-[0_0_60px_rgba(139,92,246,0.6)] animate-spin-slow',
    executing_tool: 'border-emerald-400 shadow-[0_0_55px_rgba(52,211,153,0.6)] animate-pulse',
    speaking: 'border-blue-400 shadow-[0_0_55px_rgba(0,140,255,0.65)] animate-pulse',
    error: 'border-red-500/80 shadow-[0_0_40px_rgba(239,68,68,0.4)]',
  };

  const glowColors: Record<VoiceAssistantState, string> = {
    idle: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    requesting_permission: 'from-amber-500/30 via-yellow-500/20 to-transparent',
    listening: 'from-cyan-400/40 via-blue-500/30 to-purple-500/20',
    processing: 'from-purple-500/40 via-blue-600/30 to-cyan-500/20',
    executing_tool: 'from-emerald-500/40 via-teal-500/30 to-cyan-500/20',
    speaking: 'from-blue-500/40 via-cyan-400/30 to-indigo-500/20',
    error: 'from-red-500/30 via-rose-500/20 to-transparent',
  };

  const statusLabel: Record<VoiceAssistantState, string> = {
    idle: 'Tap to Speak',
    requesting_permission: 'Requesting Mic...',
    listening: 'Listening...',
    processing: 'Thinking...',
    executing_tool: currentToolName ? `Running ${currentToolName}` : 'Executing Tool...',
    speaking: 'Speaking...',
    error: 'Microphone Error',
  };

  const accessibleStatusAnnouncement: Record<VoiceAssistantState, string> = {
    idle: 'Alexa+ assistant is idle. Tap to activate microphone or type a question.',
    requesting_permission: 'Requesting microphone access permission from your browser.',
    listening: 'Microphone is active. Listening to speech.',
    processing: 'Processing speech with Google Gemini AI.',
    executing_tool: `Executing real authorized tool: ${currentToolName || 'assistant action'}.`,
    speaking: 'Speaking assistant response aloud.',
    error: `Assistant encountered an issue: ${errorMessage || 'Microphone error'}.`,
  };

  const handleOrbClick = () => {
    if (state === 'speaking' && onStopSpeaking) {
      onStopSpeaking();
    } else if (state === 'error' && onRetry) {
      onRetry();
    } else {
      onToggleMic();
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-4 select-none"
      role="region"
      aria-label="Alexa+ Voice Assistant Interface"
    >
      {/* Live Region for Screen Readers */}
      <span className="sr-only" role="status" aria-live="polite">
        {accessibleStatusAnnouncement[state]}
      </span>

      <div className="relative flex items-center justify-center">
        {/* Ambient Outer Aura Glow */}
        <div
          className={`absolute rounded-full transition-all duration-700 blur-2xl ${sizeClasses} bg-gradient-to-tr ${glowColors[state]}`}
        />

        {/* Outer Ring Border */}
        <div
          className={`relative rounded-full border-2 transition-all duration-500 flex items-center justify-center ${sizeClasses} ${ringStyles[state]}`}
        >
          {/* Inner Interactive Orb Sphere */}
          <button
            onClick={handleOrbClick}
            type="button"
            title={
              state === 'listening'
                ? 'Stop listening'
                : state === 'speaking'
                ? 'Stop speaking'
                : state === 'error'
                ? 'Retry voice input'
                : 'Click to speak to Alexa+'
            }
            aria-label={statusLabel[state]}
            className="w-4/5 h-4/5 rounded-full bg-gradient-to-b from-[#111827] to-[#0B0F19] border border-cyan-500/40 flex flex-col items-center justify-center gap-2 transition-all duration-300 active:scale-95 hover:border-cyan-300 group cursor-pointer shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#0B0F19]"
          >
            {/* Visual Center Graphic based on State */}
            {state === 'listening' ? (
              <div className="flex items-center gap-1" aria-hidden="true">
                {[1, 2, 3, 4, 5].map(i => (
                  <span
                    key={i}
                    className="w-1 bg-cyan-400 rounded-full animate-waveform"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                      height: size === 'sm' ? '18px' : '26px',
                    }}
                  />
                ))}
              </div>
            ) : state === 'requesting_permission' ? (
              <ShieldAlert className="w-7 h-7 text-amber-400 animate-pulse" aria-hidden="true" />
            ) : state === 'processing' ? (
              <Sparkles className="w-8 h-8 text-purple-400 animate-spin" aria-hidden="true" />
            ) : state === 'executing_tool' ? (
              <Wrench className="w-7 h-7 text-emerald-400 animate-bounce" aria-hidden="true" />
            ) : state === 'speaking' ? (
              <div className="flex items-center gap-1" aria-hidden="true">
                {[1, 2, 3, 4, 5].map(i => (
                  <span
                    key={i}
                    className="w-1 bg-blue-400 rounded-full animate-pulse"
                    style={{
                      animationDelay: `${i * 0.18}s`,
                      height: `${size === 'sm' ? 12 : 16 + (i % 3) * 6}px`,
                    }}
                  />
                ))}
              </div>
            ) : state === 'error' ? (
              <AlertCircle className="w-8 h-8 text-red-400" aria-hidden="true" />
            ) : (
              <Mic className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
            )}

            {/* Orb Status Label */}
            <span
              className={`text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-center px-2 truncate max-w-[90%] transition-colors ${
                state === 'listening'
                  ? 'text-cyan-300 font-bold'
                  : state === 'requesting_permission'
                  ? 'text-amber-300'
                  : state === 'processing'
                  ? 'text-purple-300'
                  : state === 'executing_tool'
                  ? 'text-emerald-300 font-bold'
                  : state === 'speaking'
                  ? 'text-blue-300 font-semibold'
                  : state === 'error'
                  ? 'text-red-300'
                  : 'text-cyan-300/80'
              }`}
            >
              {statusLabel[state]}
            </span>
          </button>
        </div>
      </div>

      {/* Control Action Pills */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {/* Mic Control Button */}
        <button
          onClick={onToggleMic}
          type="button"
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all ${
            state === 'listening'
              ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse'
              : state === 'requesting_permission'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-[#1F2937]/70 border-gray-700 text-gray-300 hover:border-cyan-500/50 hover:text-cyan-300'
          }`}
        >
          {state === 'listening' ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Stop Listening</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>{state === 'requesting_permission' ? 'Permission Pending...' : 'Voice Input'}</span>
            </>
          )}
        </button>

        {/* Stop Speaking / Interrupt Control */}
        {state === 'speaking' && onStopSpeaking && (
          <button
            onClick={onStopSpeaking}
            type="button"
            className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-blue-600/30 border border-blue-400/60 text-blue-200 hover:bg-blue-600/50 transition-all shadow-[0_0_12px_rgba(0,140,255,0.4)]"
            title="Stop assistant speech"
          >
            <Square className="w-3 h-3 fill-blue-200" />
            <span>Stop Speaking</span>
          </button>
        )}

        {/* Retry Button on Error */}
        {state === 'error' && onRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/40 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}

        {/* Voice Audio Output Mute / Unmute Toggle */}
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            type="button"
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all ${
              isMuted
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#1F2937]/70 border-gray-700 text-gray-300 hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
            title={isMuted ? 'Unmute speech output' : 'Mute speech output'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                <span>Audio Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Audio On</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
