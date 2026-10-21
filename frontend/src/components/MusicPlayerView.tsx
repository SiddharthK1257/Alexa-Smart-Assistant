import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Disc3,
  Heart,
} from 'lucide-react';
import { api, MusicTrack, MusicPlaybackState } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const MusicPlayerView: React.FC = () => {
  const { token } = useAuth();
  const [playback, setPlayback] = useState<MusicPlaybackState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeGenre, setActiveGenre] = useState('All');
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize or fetch state
  useEffect(() => {
    api.getMusicStatus(token).then(state => {
      setPlayback(state);
      setCurrentTrack(state.current_track);
      setIsPlaying(state.is_playing);
      setVolume(state.volume);
    }).catch(console.error);
  }, [token]);

  // Audio synthesis / preview audio player
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    if (currentTrack?.preview_url) {
      if (audioRef.current.src !== currentTrack.preview_url) {
        audioRef.current.src = currentTrack.preview_url;
      }
      audioRef.current.volume = isMuted ? 0 : volume / 100;

      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.log('Audio autoplay prevented:', e);
        });
      } else {
        audioRef.current.pause();
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentTrack, isPlaying, isMuted, volume]);

  // Progress ticker when playing
  useEffect(() => {
    let interval: any;
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= currentTrack.duration) {
            handleNext();
            return 0;
          }
          return p + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const togglePlay = async () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (token) {
      api.controlMusic(nextState ? 'resume' : 'pause', undefined, token).catch(console.error);
    }
  };

  const handleNext = async () => {
    if (!playback?.queue || playback.queue.length === 0) return;
    const currentIndex = playback.queue.findIndex(t => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % playback.queue.length;
    const next = playback.queue[nextIndex];
    setCurrentTrack(next);
    setProgress(0);
    setIsPlaying(true);
    if (token) {
      api.controlMusic('next', undefined, token).catch(console.error);
    }
  };

  const handlePrevious = async () => {
    if (!playback?.queue || playback.queue.length === 0) return;
    const currentIndex = playback.queue.findIndex(t => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + playback.queue.length) % playback.queue.length;
    const prev = playback.queue[prevIndex];
    setCurrentTrack(prev);
    setProgress(0);
    setIsPlaying(true);
  };

  const selectTrack = (track: MusicTrack) => {
    setCurrentTrack(track);
    setProgress(0);
    setIsPlaying(true);
    if (token) {
      api.playMusic({ trackId: track.id }, token).catch(console.error);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (isMuted && newVol > 0) setIsMuted(false);
    if (token) {
      api.controlMusic('volume', newVol, token).catch(console.error);
    }
  };

  const toggleLike = (id: string) => {
    setLikedTracks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = Math.floor(sec % 60);
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const genres = ['All', 'Lo-Fi / Study', 'Synthwave / Electronic', 'Acoustic / Indie Folk', 'Classical / Ambient Piano', 'Smooth Jazz / Lounge'];

  const filteredQueue = playback?.queue.filter(t => activeGenre === 'All' || t.genre === activeGenre) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#111827] via-[#1A2234] to-[#111827] border border-cyan-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Disc3 className={`w-4 h-4 text-cyan-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Alexa<span className="text-cyan-400">+</span> High-Definition Music Player
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Spatial audio playback integrated with Amazon Echo Studio & Philips Hue lighting synchronization.
          </p>
        </div>

        {/* Live Audio Equalizer Bars */}
        <div className="flex items-center gap-3 bg-[#0B0F19]/80 border border-gray-700/60 px-4 py-2.5 rounded-2xl">
          <div className="flex items-end gap-1 h-6 w-12 justify-center">
            {[40, 90, 60, 100, 70].map((height, i) => (
              <motion.div
                key={i}
                animate={{
                  height: isPlaying ? [`${height * 0.2}%`, `${height}%`, `${height * 0.3}%`] : '20%',
                }}
                transition={{
                  duration: 0.7,
                  repeat: isPlaying ? Infinity : 0,
                  repeatType: 'reverse',
                  delay: i * 0.12,
                }}
                className="w-1 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-full"
              />
            ))}
          </div>
          <div className="text-left">
            <span className="block text-[11px] font-bold text-cyan-300">
              {isPlaying ? 'Streaming Audio' : 'Audio Paused'}
            </span>
            <span className="block text-[10px] text-gray-400">
              Lossless 24-bit / 96kHz
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Now Playing Card + Playlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Big Now Playing Widget (5 cols) */}
        <div className="lg:col-span-5 bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Album Cover Art */}
            <div className="relative group mx-auto w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
              <img
                src={currentTrack?.album_art || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80'}
                alt={currentTrack?.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
              
              {/* Floating Genre Tag */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-cyan-300">
                {currentTrack?.genre || 'Ambient'}
              </div>

              {/* Like Button */}
              {currentTrack && (
                <button
                  type="button"
                  onClick={() => toggleLike(currentTrack.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:text-red-400 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${likedTracks[currentTrack.id] ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              )}

              {/* Mood Pill */}
              {currentTrack?.mood && (
                <div className="absolute bottom-3 left-3 text-[11px] text-gray-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{currentTrack.mood}</span>
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white tracking-wide truncate">
                {currentTrack?.title || 'Midnight Chill Lo-Fi'}
              </h2>
              <p className="text-xs text-cyan-300 font-medium">
                {currentTrack?.artist || 'Alexa Beats Collective'}
              </p>
              <p className="text-[11px] text-gray-400">
                {currentTrack?.album || 'Study Waves Vol. 1'}
              </p>
            </div>
          </div>

          {/* Player Controls & Scrubber */}
          <div className="space-y-4">
            {/* Scrubber Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden relative cursor-pointer">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: `${currentTrack ? (progress / currentTrack.duration) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>{formatSeconds(progress)}</span>
                <span>{currentTrack ? formatSeconds(currentTrack.duration) : '3:04'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={handlePrevious}
                className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all active:scale-90"
                title="Previous Track"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,202,255,0.4)] transition-all active:scale-95"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current text-black" />
                ) : (
                  <Play className="w-6 h-6 fill-current text-black ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all active:scale-90"
                title="Next Track"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center gap-3 pt-2 text-gray-400">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="hover:text-cyan-300 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={e => handleVolumeChange(Number(e.target.value))}
                className="w-32 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[10px] font-mono text-gray-400 w-6">
                {isMuted ? '0%' : `${volume}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Playlist & Catalog (7 cols) */}
        <div className="lg:col-span-7 bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-5">
          {/* Genre Filter Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider">
              <span>Curated Audio Stations</span>
              <span className="text-[11px] text-cyan-400">{filteredQueue.length} Tracks Ready</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {genres.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveGenre(g)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-medium transition-all ${
                    activeGenre === g
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Track List */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredQueue.map(track => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => selectTrack(track)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md'
                      : 'bg-[#0B0F19]/60 border-gray-800/80 hover:bg-gray-800/40 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-700">
                      <img
                        src={track.album_art}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-cyan-300' : 'text-gray-200'}`}>
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 truncate">
                        {track.artist} • <span className="text-gray-500">{track.album}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                      {track.genre.split('/')[0]}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {formatSeconds(track.duration)}
                    </span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        if (isCurrent) togglePlay();
                        else selectTrack(track);
                      }}
                      className="p-2 rounded-full hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alexa Voice Tip */}
          <div className="p-3 rounded-2xl bg-[#0B0F19] border border-cyan-500/20 flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Voice commands: <em>"Alexa, play lo-fi study beats"</em> or <em>"Alexa, pause music"</em></span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">Matter Audio Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
