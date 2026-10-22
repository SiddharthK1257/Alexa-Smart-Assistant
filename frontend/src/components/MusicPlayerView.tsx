import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Disc3,
  Heart,
  Search,
  Mic,
  MicOff,
  ExternalLink,
  Loader2,
  AlertCircle,
  Info,
  CheckCircle2,
  Youtube,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { api, MusicTrack, MusicPlaybackState } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const MusicPlayerView: React.FC = () => {
  const { token } = useAuth();
  const { speak } = useSpeechSynthesis();

  // Playback & Track State
  const [playback, setPlayback] = useState<MusicPlaybackState | null>(null);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({});

  // YouTube API Configuration & Search
  const [apiConfigured, setApiConfigured] = useState<boolean>(true);
  const [apiMessage, setApiMessage] = useState<string>('');
  const [searchSongQuery, setSearchSongQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'search'>('queue');
  const [activeGenre, setActiveGenre] = useState('All');
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // YouTube IFrame Player refs
  const playerRef = useRef<any>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const announcedTrackIdRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<any>(null);

  // Initialize playback state from server
  useEffect(() => {
    api.getMusicStatus(token).then(state => {
      setPlayback(state);
      if (state.current_track) {
        setCurrentTrack(state.current_track);
        if (state.current_track.duration) {
          setDuration(state.current_track.duration);
        }
      }
      setVolume(state.volume || 75);
      if (state.api_configured !== undefined) {
        setApiConfigured(state.api_configured);
        if (!state.api_configured && state.message) {
          setApiMessage(state.message);
        }
      }
    }).catch(console.error);

    // Also verify API configuration
    api.getMusicConfig(token).then(cfg => {
      setApiConfigured(cfg.configured);
      setApiMessage(cfg.message);
    }).catch(() => {});
  }, [token]);

  // Load YouTube IFrame Player API Script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize or re-create YouTube Player
  const initializeYouTubePlayer = useCallback((videoId: string) => {
    if (!window.YT || !window.YT.Player) {
      // If script not finished loading, wait for callback
      window.onYouTubeIframeAPIReady = () => {
        initializeYouTubePlayer(videoId);
      };
      return;
    }

    // If player instance already exists, load the video instead of recreating iframe
    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        setPlayerError(null);
        playerRef.current.loadVideoById(videoId);
        return;
      } catch (err) {
        console.warn('Could not loadVideoById directly, re-instantiating player:', err);
      }
    }

    try {
      playerRef.current = new window.YT.Player('youtube-iframe-player', {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 1, // Official YouTube player controls visible as required
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            isPlayerReadyRef.current = true;
            event.target.setVolume(volume);
            if (isMuted) {
              event.target.mute();
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsBuffering(false);
              setPlayerError(null);

              // Update duration from player if available
              if (playerRef.current?.getDuration) {
                const totalSec = Math.floor(playerRef.current.getDuration());
                if (totalSec > 0) setDuration(totalSec);
              }

              // Announce playback ONLY after confirmed by actual player
              if (currentTrack && announcedTrackIdRef.current !== currentTrack.videoId) {
                announcedTrackIdRef.current = currentTrack.videoId;
                speak(`Now playing ${currentTrack.title} on YouTube.`);
              }
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              setIsBuffering(false);
            } else if (event.data === window.YT.PlayerState.BUFFERING) {
              setIsBuffering(true);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              setIsBuffering(false);
              handleNextTrack();
            }
          },
          onError: (event: any) => {
            const code = event.data;
            setIsPlaying(false);
            setIsBuffering(false);

            if (code === 101 || code === 150) {
              setPlayerError(
                'This video cannot be played in an embedded player because the content owner restricts third-party playback. You can watch it directly on YouTube or choose another video.'
              );
            } else if (code === 100) {
              setPlayerError('This video has been removed or set to private on YouTube.');
            } else if (code === 2) {
              setPlayerError('Invalid YouTube video parameter.');
            } else {
              setPlayerError('YouTube playback encountered an error.');
            }
          },
        },
      });
    } catch (err: any) {
      console.error('Error creating YouTube Player:', err);
    }
  }, [volume, isMuted, speak, currentTrack]);

  // Keep player in sync with currentTrack
  useEffect(() => {
    if (!currentTrack?.videoId) return;

    // Check if player container is mounted
    const container = document.getElementById('youtube-iframe-player');
    if (!container) return;

    if (!playerRef.current) {
      initializeYouTubePlayer(currentTrack.videoId);
    } else if (isPlayerReadyRef.current) {
      setPlayerError(null);
      try {
        playerRef.current.loadVideoById(currentTrack.videoId);
      } catch (e) {
        console.warn('Error loading video by ID:', e);
      }
    }
  }, [currentTrack?.videoId, initializeYouTubePlayer]);

  // Polling playback time when playing
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        if (playerRef.current && isPlayerReadyRef.current && playerRef.current.getCurrentTime) {
          try {
            const cur = Math.floor(playerRef.current.getCurrentTime());
            setProgress(cur);
            const total = Math.floor(playerRef.current.getDuration());
            if (total > 0 && total !== duration) {
              setDuration(total);
            }
          } catch {
            // Player might be transitioning
          }
        }
      }, 1000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, []);

  // Voice command handler
  const handleVoiceCommand = async (spokenText: string) => {
    if (!spokenText.trim()) return;
    const lower = spokenText.toLowerCase().trim();

    // 1. Pause
    if (lower.includes('pause') || lower === 'stop' || lower === 'stop music' || lower.includes('stop the music')) {
      togglePlay();
      speak('Music paused.');
      return;
    }

    // 2. Resume
    if (lower === 'resume' || lower === 'resume music' || lower.includes('resume')) {
      if (!isPlaying) togglePlay();
      speak('Resuming playback.');
      return;
    }

    // 3. Next song
    if (lower.includes('next song') || lower.includes('next track') || lower === 'next' || lower === 'skip') {
      handleNextTrack();
      return;
    }

    // 4. Show search results / Find
    if (lower.includes('show me the search results') || lower.includes('show search results') || lower.startsWith('find')) {
      const q = spokenText
        .replace(/^alexa[, ]*/i, '')
        .replace(/^(?:find|search for|show me(?: the)? search results for|show me search results|show me the search results)\s*/i, '')
        .trim();
      const targetQuery = q || searchSongQuery || 'relaxing music';
      setSearchSongQuery(targetQuery);
      await executeSearch(targetQuery);
      setActiveTab('search');
      speak(`Here are the search results for ${targetQuery}.`);
      return;
    }

    // 5. Play relaxing music / play [song] by [artist] / general play
    const cleanQuery = spokenText
      .replace(/^alexa[, ]*/i, '')
      .replace(/can you|please|could you|i want you to/gi, '')
      .replace(/play the song|play song|play music|stream the song|stream song|play|stream/gi, '')
      .replace(/on youtube|from youtube/gi, '')
      .trim();

    const targetQuery = cleanQuery || 'lo-fi chill beats';
    setSearchSongQuery(targetQuery);
    await handlePlayQuery(targetQuery);
  };

  const { isListening, toggleListening } = useSpeechRecognition(handleVoiceCommand);

  // Play a song or search query
  const handlePlayQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    setSearchFeedback(null);
    try {
      const state = await api.playMusic({ query: queryText.trim() }, token);
      setPlayback(state);
      if (state.current_track) {
        selectTrack(state.current_track);
      }
      if (state.api_configured !== undefined) {
        setApiConfigured(state.api_configured);
      }
    } catch (err: any) {
      console.error('Play music error:', err);
      setSearchFeedback('Could not play requested music. Please check your network or API configuration.');
    } finally {
      setIsSearching(false);
    }
  };

  // Perform YouTube search
  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    setSearchFeedback(null);
    try {
      const res = await api.searchMusic(queryText.trim(), token);
      setSearchResults(res.tracks || []);
      if (res.configured !== undefined) {
        setApiConfigured(res.configured);
      }
      if (res.message) {
        setSearchFeedback(res.message);
      }
      if (res.tracks && res.tracks.length > 0) {
        setActiveTab('search');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchFeedback('Search failed. Please ensure the backend is running and network is active.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSongQuery.trim()) return;
    await executeSearch(searchSongQuery.trim());
  };

  // Select a track from results or queue
  const selectTrack = (track: MusicTrack) => {
    setPlayerError(null);
    setCurrentTrack(track);
    setProgress(0);
    setDuration(track.duration || 0);

    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        playerRef.current.loadVideoById(track.videoId);
      } catch (err) {
        console.warn('Could not load video directly:', err);
      }
    }

    if (token) {
      api.playMusic({ videoId: track.videoId, query: track.title, artist: track.artist }, token).catch(console.error);
    }
  };

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!playerRef.current || !isPlayerReadyRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
        if (token) api.controlMusic('pause', undefined, token).catch(() => {});
      } else {
        setPlayerError(null);
        playerRef.current.playVideo();
        if (token) api.controlMusic('resume', undefined, token).catch(() => {});
      }
    } catch (e) {
      console.warn('togglePlay error:', e);
    }
  };

  // Next Track
  const handleNextTrack = () => {
    const list = activeTab === 'search' && searchResults.length > 0
      ? searchResults
      : (playback?.queue || []);

    if (list.length === 0) return;

    const currentIndex = list.findIndex(t => t.videoId === currentTrack?.videoId || t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % list.length;
    const next = list[nextIndex];

    selectTrack(next);
    if (token) {
      api.controlMusic('next', undefined, token).catch(() => {});
    }
  };

  // Previous Track
  const handlePreviousTrack = () => {
    const list = activeTab === 'search' && searchResults.length > 0
      ? searchResults
      : (playback?.queue || []);

    if (list.length === 0) return;

    const currentIndex = list.findIndex(t => t.videoId === currentTrack?.videoId || t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    const prev = list[prevIndex];

    selectTrack(prev);
  };

  // Seek handler
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = Math.floor(pct * duration);
    try {
      playerRef.current.seekTo(targetSeconds, true);
      setProgress(targetSeconds);
    } catch (err) {
      console.warn('Seek error:', err);
    }
  };

  // Volume Change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (isMuted && newVol > 0) setIsMuted(false);
    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        playerRef.current.setVolume(newVol);
        if (isMuted && newVol > 0) {
          playerRef.current.unMute();
        }
      } catch {}
    }
    if (token) {
      api.controlMusic('volume', newVol, token).catch(() => {});
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        if (nextMuted) playerRef.current.mute();
        else playerRef.current.unMute();
      } catch {}
    }
  };

  // Like track toggle
  const toggleLike = (id: string) => {
    setLikedTracks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Duration Formatter
  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec) || sec <= 0) return '0:00';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const remaining = Math.floor(sec % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
    }
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const genres = ['All', 'Lo-Fi / Study', 'Synthwave / Electronic', 'Classical / Ambient Piano', 'Smooth Jazz / Lounge', 'Acoustic / Indie Folk'];

  const queueList = playback?.queue || [];
  const displayQueue = queueList.filter(t => activeGenre === 'All' || t.album?.includes(activeGenre) || t.title.toLowerCase().includes(activeGenre.toLowerCase().split('/')[0].trim()));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0B0F19] via-[#111827] to-[#1A2234] border border-cyan-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Youtube className="w-5 h-5 text-red-500 fill-red-500" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Alexa<span className="text-cyan-400">+</span> YouTube Music Hub
            </h1>
          </div>
          <p className="text-xs text-gray-400 max-w-xl">
            Ask by voice to search and play songs, artists, and music videos. Powered by the official YouTube embedded player with standard ad-supported free playback.
          </p>
        </div>

        {/* Live Status Badges & Visualizer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-[#0B0F19]/90 border border-gray-700/60 px-4 py-2.5 rounded-2xl shrink-0">
            {/* Equalizer Bars */}
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
                {isPlaying ? 'Confirmed Playing' : isBuffering ? 'Buffering...' : 'Playback Paused'}
              </span>
              <span className="block text-[10px] text-gray-400">
                Official YouTube Player
              </span>
            </div>
          </div>

          {/* API Status Button */}
          <button
            type="button"
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className={`px-3 py-2 rounded-2xl border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              apiConfigured
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="View YouTube Data API configuration info"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiConfigured ? 'API Active' : 'API Setup'}</span>
          </button>
        </div>
      </div>

      {/* API Setup Banner (shown when not configured or user clicks guide) */}
      {(!apiConfigured || showSetupGuide) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111827] border border-cyan-500/40 rounded-3xl p-5 shadow-xl space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Official YouTube Data API v3 Configuration
                  {!apiConfigured && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Configuration Required for Dynamic Search
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  To dynamically search YouTube's catalog for any song or artist, configure your free YouTube Data API v3 key in your backend <code className="text-cyan-300 bg-gray-900 px-1.5 py-0.5 rounded font-mono text-[11px]">.env</code> file.
                </p>
                {apiMessage && (
                  <p className="text-[11px] text-cyan-300 font-mono bg-cyan-950/40 border border-cyan-500/20 px-2.5 py-1 rounded-xl">
                    Status: {apiMessage}
                  </p>
                )}
                <div className="text-xs text-gray-400 space-y-1 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span><strong>Step 1:</strong> Visit <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Google Cloud Console</a> & create or select a project.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span><strong>Step 2:</strong> Go to <em>APIs & Services &gt; Enable APIs</em>, search for <strong>YouTube Data API v3</strong>, and click <strong>Enable</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span><strong>Step 3:</strong> In <em>Credentials</em>, create an <strong>API Key</strong> and add <code className="text-cyan-300 bg-gray-900 px-1 py-0.5 rounded font-mono">YOUTUBE_API_KEY=your_key</code> in your backend <code className="text-cyan-300 bg-gray-900 px-1 py-0.5 rounded font-mono">.env</code>.</span>
                  </div>
                </div>
                <p className="text-[11px] text-cyan-300/80 pt-1">
                  ✨ Curated featured YouTube music channels (Lo-Fi Girl, Synthwave, Classical Piano, Smooth Jazz, Acoustic Guitar) and direct YouTube video links remain 100% playable even without an API key!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSetupGuide(false)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-gray-800"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* YouTube Search Bar & Voice Input */}
      <div className="bg-[#111827] p-4 rounded-3xl border border-gray-800 shadow-xl space-y-2">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchSongQuery}
              onChange={e => setSearchSongQuery(e.target.value)}
              placeholder="Search or ask in voice for ANY song or artist on YouTube (e.g. Blinding Lights, Queen, Relaxing Lo-Fi)..."
              className="w-full bg-[#0B0F19] border border-gray-700 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3.5 top-3" />
            )}
          </div>

          {/* Voice Search Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
            title="Ask by voice (e.g. 'Play Blinding Lights by The Weeknd', 'Find relaxing music', 'Pause', 'Resume')"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Search'}</span>
          </button>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all shrink-0 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>

        {searchFeedback && (
          <p className="text-[11px] text-amber-300/90 px-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>{searchFeedback}</span>
          </p>
        )}
      </div>

      {/* Main Grid: YouTube Video Player (Left) + Queue / Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Embedded YouTube Player & Controls (5 cols) */}
        <div className="lg:col-span-6 bg-[#111827]/90 border border-gray-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* 16:9 YouTube IFrame Player Container */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-cyan-500/30">
              <div id="youtube-iframe-player" className="w-full h-full" />
              {isBuffering && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Error & Restriction Notice */}
            {playerError && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">{playerError}</p>
                </div>
                {currentTrack?.youtube_url && (
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={currentTrack.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Watch Directly on YouTube</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleNextTrack}
                      className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-[11px] transition-all"
                    >
                      Play Next Track
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Track Info Card */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-[#0B0F19]/80 border border-gray-800">
              <div className="space-y-0.5 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-extrabold flex items-center gap-1">
                    <Youtube className="w-2.5 h-2.5 fill-red-500" />
                    YOUTUBE
                  </span>
                  {currentTrack?.channelTitle && (
                    <span className="text-[11px] text-cyan-300 font-semibold truncate">
                      {currentTrack.channelTitle}
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-white tracking-wide truncate" title={currentTrack?.title}>
                  {currentTrack?.title || 'lofi hip hop radio - beats to relax/study to'}
                </h2>
                {currentTrack?.description && (
                  <p className="text-[10px] text-gray-400 line-clamp-1">
                    {currentTrack.description}
                  </p>
                )}
              </div>

              {/* Action Buttons: Open on YouTube & Heart */}
              <div className="flex items-center gap-1.5 shrink-0">
                {currentTrack?.youtube_url && (
                  <a
                    href={currentTrack.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all"
                    title="Watch on official YouTube site"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {currentTrack && (
                  <button
                    type="button"
                    onClick={() => toggleLike(currentTrack.id)}
                    className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-800 text-white hover:text-red-400 transition-colors"
                    title="Favorite track"
                  >
                    <Heart className={`w-3.5 h-3.5 ${likedTracks[currentTrack.id] ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Player Controls & Scrubber */}
          <div className="space-y-3 pt-2">
            {/* Scrubber Bar */}
            <div className="space-y-1">
              <div
                onClick={handleSeek}
                className="w-full bg-gray-800 h-2 rounded-full overflow-hidden relative cursor-pointer group"
                title="Click to seek"
              >
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all group-hover:from-cyan-400 group-hover:to-blue-400"
                  style={{
                    width: `${duration > 0 ? Math.min(100, (progress / duration) * 100) : 0}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>{formatSeconds(progress)}</span>
                <span className="text-cyan-400 font-bold">
                  {duration > 0 ? formatSeconds(duration) : (currentTrack?.durationFormatted || 'LIVE / Stream')}
                </span>
              </div>
            </div>

            {/* Playback Action Buttons */}
            <div className="flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={handlePreviousTrack}
                className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all active:scale-90"
                title="Previous Video"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-13 h-13 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,202,255,0.4)] transition-all active:scale-95 p-3.5"
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
                onClick={handleNextTrack}
                className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all active:scale-90"
                title="Next Video"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center gap-3 pt-1 text-gray-400">
              <button
                type="button"
                onClick={toggleMute}
                className="hover:text-cyan-300 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
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
              <span className="text-[10px] font-mono text-gray-400 w-7">
                {isMuted ? '0%' : `${volume}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Search Results & Music Queue (6 cols) */}
        <div className="lg:col-span-6 bg-[#111827]/90 border border-gray-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Tabs: Queue vs Search Results */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    activeTab === 'queue'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Featured & Queue ({displayQueue.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    activeTab === 'search'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Search Results ({searchResults.length})
                </button>
              </div>

              <span className="text-[10px] text-gray-500">
                {activeTab === 'search' ? `${searchResults.length} videos found` : 'Curated streams'}
              </span>
            </div>

            {/* Genre Filter Pills (visible in queue view) */}
            {activeTab === 'queue' && (
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
            )}

            {/* Video List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {activeTab === 'search' && searchResults.length === 0 && !isSearching && (
                <div className="p-8 text-center space-y-2 border border-dashed border-gray-800 rounded-2xl">
                  <Search className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-xs text-gray-400">
                    No search results yet. Type a song, artist, or style in the search bar above or click the microphone to ask by voice.
                  </p>
                  {!apiConfigured && (
                    <button
                      type="button"
                      onClick={() => setShowSetupGuide(true)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold hover:bg-cyan-500/30"
                    >
                      View YouTube API Setup Guide
                    </button>
                  )}
                </div>
              )}

              {(activeTab === 'search' ? searchResults : displayQueue).map(track => {
                const isSelected = track.videoId === currentTrack?.videoId || track.id === currentTrack?.id;

                return (
                  <div
                    key={track.videoId || track.id}
                    onClick={() => selectTrack(track)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md'
                        : 'bg-[#0B0F19]/60 border-gray-800/80 hover:border-gray-700 hover:bg-[#0B0F19]'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Video Thumbnail */}
                      <div className="w-12 h-10 rounded-xl overflow-hidden shrink-0 border border-gray-700 relative bg-black">
                        <img
                          src={track.thumbnail || track.album_art || `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        {isSelected && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Disc3 className="w-4 h-4 text-cyan-400 animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Video Title & Channel */}
                      <div className="overflow-hidden">
                        <h4 className={`font-bold text-xs truncate ${isSelected ? 'text-cyan-300' : 'text-gray-200'}`} title={track.title}>
                          {track.title}
                        </h4>
                        <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                          <span>{track.channelTitle || track.artist}</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-red-400 font-semibold">YouTube</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-gray-400 font-mono shrink-0">
                      <span className="text-[10px]">
                        {track.durationFormatted || (track.duration ? formatSeconds(track.duration) : 'Video')}
                      </span>
                      <a
                        href={track.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        title="Open on YouTube"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Honest YouTube Playback Disclaimer */}
          <div className="p-3 rounded-2xl bg-[#0B0F19]/60 border border-gray-800/80 text-[10px] text-gray-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-300">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>YouTube Terms & Playback Policy Compliance</span>
            </div>
            <p className="leading-relaxed">
              Playback is powered by the official YouTube IFrame Player with standard free, ad-supported streaming. Third-party ad bypass, audio extraction, and background playback are strictly prohibited in adherence to YouTube API Services Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
