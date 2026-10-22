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
  Search,
  Mic,
  MicOff,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { api, MusicTrack, MusicPlaybackState } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export const MusicPlayerView: React.FC = () => {
  const { token } = useAuth();
  const { speak } = useSpeechSynthesis();
  const [playback, setPlayback] = useState<MusicPlaybackState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeGenre, setActiveGenre] = useState('All');
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({});

  // Spotify Search & Voice State
  const [searchSongQuery, setSearchSongQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [spotifySearchResults, setSpotifySearchResults] = useState<MusicTrack[]>([]);
  const [playerMode, setPlayerMode] = useState<'spotify' | 'complete' | 'hifi'>('spotify');

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

  // Voice handler for Spotify song queries
  const handleVoiceSongSearch = async (spokenText: string) => {
    if (!spokenText.trim()) return;
    const cleanSong = spokenText
      .replace(/^alexa[, ]*/i, '')
      .replace(/can you|please|could you/gi, '')
      .replace(/play the song|play song|play music|stream the song|stream|play/gi, '')
      .replace(/on spotify|from spotify/gi, '')
      .trim();

    const lower = cleanSong.toLowerCase();
    const isGeneric = !cleanSong || ['any', 'some', 'songs', 'song', 'spotify', 'any songs', 'spotify songs'].includes(lower);
    const queryToPlay = isGeneric ? 'spotify top hits' : (cleanSong || spokenText.trim());

    setSearchSongQuery(isGeneric ? 'Spotify Global Top Hits' : queryToPlay);
    await handlePlaySong(queryToPlay);
  };

  const { isListening, toggleListening } = useSpeechRecognition(handleVoiceSongSearch);

  const handlePlaySong = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    try {
      const state = await api.playMusic({ query: queryText.trim() }, token);
      setPlayback(state);
      setCurrentTrack(state.current_track);
      setIsPlaying(true);
      setProgress(0);
      speak(`Now playing ${state.current_track.title} by ${state.current_track.artist} on Spotify.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSpotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSongQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.searchMusic(searchSongQuery.trim(), token);
      setSpotifySearchResults(res.tracks);
      if (res.tracks.length > 0) {
        selectTrack(res.tracks[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Audio synthesis & continuous full-length streaming player
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // NEVER loop 30-sec preview: Play complete track till stop or pause
      audioRef.current.loop = false;
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (audio) {
        setProgress(Math.floor(audio.currentTime));
      }
    };

    const handleEnded = () => {
      // Complete track reached! Play next track in queue, never repeat 30s
      handleNext();
    };

    const handleLoadedMetadata = () => {
      if (audio && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        if (currentTrack && (!currentTrack.duration || currentTrack.duration < 60)) {
          setCurrentTrack(prev => prev ? { ...prev, duration: Math.floor(audio.duration) } : null);
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    if (currentTrack?.preview_url) {
      if (audio.src !== currentTrack.preview_url) {
        audio.src = currentTrack.preview_url;
      }
      audio.volume = isMuted ? 0 : volume / 100;

      if (isPlaying) {
        audio.play().catch(e => {
          console.log('Audio autoplay prevented:', e);
        });
      } else {
        audio.pause();
      }
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentTrack, isPlaying, isMuted, volume]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !currentTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = pct * currentTrack.duration;
    audioRef.current.currentTime = targetTime;
    setProgress(Math.floor(targetTime));
  };

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
      api.playMusic({ trackId: track.id, query: `${track.title} ${track.artist}` }, token).catch(console.error);
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

  const filteredQueue = [
    ...spotifySearchResults,
    ...(playback?.queue.filter(t => activeGenre === 'All' || t.genre === activeGenre) || []),
  ];

  const isCurrentSpotify = currentTrack?.source === 'Spotify' || !!currentTrack?.spotify_url;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#111827] via-[#1A2234] to-[#111827] border border-cyan-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Disc3 className={`w-4 h-4 text-cyan-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Alexa<span className="text-cyan-400">+</span> Spotify & Lossless Audio Hub
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Ask by voice to play any song present on Spotify — integrated with spatial audio playback, high-definition streaming, and smart device controls.
          </p>
        </div>

        {/* Live Audio Equalizer Bars */}
        <div className="flex items-center gap-3 bg-[#0B0F19]/80 border border-gray-700/60 px-4 py-2.5 rounded-2xl shrink-0">
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

      {/* Spotify Search Bar & Voice Input */}
      <div className="bg-[#111827] p-4 rounded-3xl border border-gray-800 shadow-xl">
        <form onSubmit={handleSearchSpotify} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchSongQuery}
              onChange={e => setSearchSongQuery(e.target.value)}
              placeholder="Search or ask in voice for ANY song on Spotify (e.g. Blinding Lights, Shape of You, Bohemian Rhapsody)..."
              className="w-full bg-[#0B0F19] border border-gray-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#1DB954] transition-colors"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-[#1DB954] animate-spin absolute right-3.5 top-3" />
            )}
          </div>

          {/* Voice Search Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-[#1DB954]/20 text-[#1DB954] border-[#1DB954]/40 hover:bg-[#1DB954]/30'
            }`}
            title="Ask in voice to play any song on Spotify"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Play'}</span>
          </button>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-2xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs transition-all shrink-0"
          >
            Play on Spotify
          </button>
        </form>
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-80" />
              
              {/* Floating Genre / Spotify Tag */}
              <div className="absolute top-3 left-3">
                {isCurrentSpotify ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/50 text-[10px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Spotify Stream
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-cyan-300">
                    {currentTrack?.genre || 'Ambient'}
                  </span>
                )}
              </div>

              {/* Like & Spotify Direct Buttons */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                {currentTrack?.spotify_url && (
                  <a
                    href={currentTrack.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[#1DB954] hover:bg-[#1DB954]/20 transition-all"
                    title="Open on Spotify"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {currentTrack && (
                  <button
                    type="button"
                    onClick={() => toggleLike(currentTrack.id)}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:text-red-400 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${likedTracks[currentTrack.id] ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                )}
              </div>

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
              <p className="text-[11px] text-gray-400 truncate">
                {currentTrack?.album || 'Echo Sanctuary Vol. 1'}
              </p>
            </div>
          </div>

          {/* Player Mode Switcher */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-1.5 p-1 rounded-2xl bg-[#0B0F19] border border-gray-800 text-[11px]">
              <button
                type="button"
                onClick={() => setPlayerMode('spotify')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all ${
                  playerMode === 'spotify'
                    ? 'bg-[#1DB954] text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Spotify Embed
              </button>
              <button
                type="button"
                onClick={() => setPlayerMode('complete')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all ${
                  playerMode === 'complete'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Complete Song
              </button>
              <button
                type="button"
                onClick={() => setPlayerMode('hifi')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all ${
                  playerMode === 'hifi'
                    ? 'bg-gray-700 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Studio Hi-Fi
              </button>
            </div>

            {/* Spotify Official Web Player Embed */}
            {playerMode === 'spotify' && (
              <div className="overflow-hidden rounded-2xl border border-emerald-500/40 shadow-xl bg-black/40">
                <iframe
                  src={
                    currentTrack?.spotify_embed_url ||
                    (currentTrack?.spotify_id
                      ? `https://open.spotify.com/embed/track/${currentTrack.spotify_id}?utm_source=generator&theme=0`
                      : 'https://open.spotify.com/embed/track/0VjIjW4GlUZAMYd2vXMi3b?utm_source=generator&theme=0')
                  }
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title={`Spotify Player: ${currentTrack?.title || 'Song'}`}
                  className="w-full"
                />
              </div>
            )}

            {/* Complete Full Original Song Stream */}
            {playerMode === 'complete' && (
              <div className="overflow-hidden rounded-2xl border border-cyan-500/40 shadow-xl bg-black/40">
                <iframe
                  src={
                    currentTrack?.full_audio_url ||
                    `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent((currentTrack?.artist || '') + ' ' + (currentTrack?.title || '') + ' Official Audio')}&autoplay=1`
                  }
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  loading="lazy"
                  title={`Complete Original Track: ${currentTrack?.title || 'Song'}`}
                  className="w-full"
                />
              </div>
            )}

            {/* Open in Spotify App Direct Button */}
            {currentTrack?.spotify_url && (
              <a
                href={currentTrack.spotify_uri || currentTrack.spotify_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs transition-all shadow-lg shadow-[#1DB954]/20"
                title="Launch official Spotify App or Web Player"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Complete Song in Spotify App</span>
              </a>
            )}
          </div>

          {/* Player Controls & Scrubber */}
          <div className="space-y-4">
            {/* Scrubber Bar */}
            <div className="space-y-1.5">
              <div
                onClick={handleSeek}
                className="w-full bg-gray-800 h-2 rounded-full overflow-hidden relative cursor-pointer group"
                title="Click to seek"
              >
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all group-hover:from-cyan-400 group-hover:to-blue-400"
                  style={{
                    width: `${currentTrack && currentTrack.duration > 0 ? Math.min(100, (progress / currentTrack.duration) * 100) : 0}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>{formatSeconds(progress)}</span>
                <span className="text-cyan-400 font-bold">
                  {currentTrack ? `${formatSeconds(currentTrack.duration)} (Full Track)` : '3:04'}
                </span>
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

        {/* Right Column: Spotify & Curated Queue (7 cols) */}
        <div className="lg:col-span-7 bg-[#111827]/90 border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Music Queue & Global Streams</h3>
              </div>
              <span className="text-[11px] text-gray-400">{filteredQueue.length} Tracks Available</span>
            </div>

            {/* Genre Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {genres.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveGenre(g)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
                    activeGenre === g
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-gray-800/60 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Tracks List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredQueue.map(track => {
                const isSelected = track.id === currentTrack?.id;
                const isTrackSpotify = track.source === 'Spotify' || !!track.spotify_url;

                return (
                  <div
                    key={track.id}
                    onClick={() => selectTrack(track)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md'
                        : 'bg-[#0B0F19]/60 border-gray-800/80 hover:border-gray-700 hover:bg-[#0B0F19]'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-gray-700 relative">
                        <img src={track.album_art} alt={track.title} className="w-full h-full object-cover" />
                        {isSelected && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Disc3 className="w-4 h-4 text-cyan-400 animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`font-bold text-xs truncate ${isSelected ? 'text-cyan-300' : 'text-gray-200'}`}>
                            {track.title}
                          </h4>
                          {isTrackSpotify && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[#1DB954] text-[9px] font-bold">
                              SPOTIFY
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">
                          {track.artist} • {track.genre}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 font-mono shrink-0">
                      <span>{formatSeconds(track.duration)}</span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          toggleLike(track.id);
                        }}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Heart className={`w-3.5 h-3.5 ${likedTracks[track.id] ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
