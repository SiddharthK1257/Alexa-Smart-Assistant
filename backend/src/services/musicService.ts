import { query } from '../db/supabase.js';
import { config } from '../config.js';

export interface MusicTrack {
  id: string; // YouTube videoId
  videoId: string;
  title: string;
  artist: string; // Channel name or musician
  channelTitle: string;
  album?: string;
  album_art: string; // Official YouTube high-res thumbnail
  thumbnail: string;
  duration: number; // in seconds
  durationFormatted?: string;
  youtube_url: string; // https://www.youtube.com/watch?v=videoId
  embed_url: string; // https://www.youtube.com/embed/videoId
  source: 'YouTube';
  description?: string;
  publishedAt?: string;
}

export interface PlaybackState {
  current_track: MusicTrack;
  is_playing: boolean;
  progress_seconds: number;
  volume: number;
  queue: MusicTrack[];
  api_configured: boolean;
  message?: string;
  error?: string | null;
}

export interface YouTubeSearchResult {
  tracks: MusicTrack[];
  configured: boolean;
  error?: string;
  message?: string;
}

// Helper: Decode HTML entities returned by YouTube Data API v3
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}

// Helper: Parse ISO 8601 duration (e.g. PT3M45S) into total seconds
function parseIsoDuration(durationStr: string): number {
  if (!durationStr) return 0;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// Helper: Format seconds to m:ss or h:mm:ss
function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remSec = Math.floor(sec % 60);
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${remSec < 10 ? '0' : ''}${remSec}`;
  }
  return `${mins}:${remSec < 10 ? '0' : ''}${remSec}`;
}

// Curated verified, official embeddable YouTube music tracks and live streams
export const YOUTUBE_FEATURED_TRACKS: MusicTrack[] = [
  {
    id: 'jfKfPfyJRdk',
    videoId: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio - beats to relax/study to',
    artist: 'Lofi Girl',
    channelTitle: 'Lofi Girl',
    album: 'Lofi Girl Radio 24/7',
    duration: 0, // Live stream / continuous
    durationFormatted: 'LIVE',
    album_art: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    youtube_url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    embed_url: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    source: 'YouTube',
    description: 'Peaceful lofi hip hop radio stream featuring beats to study, relax, and focus to.',
  },
  {
    id: '4xDzrJKXOOY',
    videoId: '4xDzrJKXOOY',
    title: 'synthwave radio - chill synth / retro beats to chill/game to',
    artist: 'Lofi Girl - Synthwave',
    channelTitle: 'Lofi Girl',
    album: 'Retro Electro Waves',
    duration: 0,
    durationFormatted: 'LIVE',
    album_art: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
    youtube_url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    embed_url: 'https://www.youtube.com/embed/4xDzrJKXOOY',
    source: 'YouTube',
    description: 'Chilled out retro synthwave and cyberpunk electronic music.',
  },
  {
    id: '4Tr0otuiQuU',
    videoId: '4Tr0otuiQuU',
    title: 'Deep Focus Classical Piano - Peaceful Ambient Piano Study Session',
    artist: 'Relaxing Piano Studio',
    channelTitle: 'Relaxing Piano Studio',
    album: 'Nocturnes for Thought',
    duration: 3600,
    durationFormatted: '60:00',
    album_art: 'https://i.ytimg.com/vi/4Tr0otuiQuU/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/4Tr0otuiQuU/hqdefault.jpg',
    youtube_url: 'https://www.youtube.com/watch?v=4Tr0otuiQuU',
    embed_url: 'https://www.youtube.com/embed/4Tr0otuiQuU',
    source: 'YouTube',
    description: 'Gentle classical piano compositions designed for deep concentration and restful thinking.',
  },
  {
    id: 'Dx5qFachd3A',
    videoId: 'Dx5qFachd3A',
    title: 'Relaxing Jazz Music - Warm Ambience & Smooth Coffee Shop Vibes',
    artist: 'Cafe Music BGM channel',
    channelTitle: 'Cafe Music BGM channel',
    album: 'Warm Cafe Sessions',
    duration: 12600,
    durationFormatted: '3:30:00',
    album_art: 'https://i.ytimg.com/vi/Dx5qFachd3A/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/Dx5qFachd3A/hqdefault.jpg',
    youtube_url: 'https://www.youtube.com/watch?v=Dx5qFachd3A',
    embed_url: 'https://www.youtube.com/embed/Dx5qFachd3A',
    source: 'YouTube',
    description: 'Smooth acoustic jazz, soft piano, and upright bass recorded in warm coffee shop ambience.',
  },
  {
    id: '5qap5aO4i9A',
    videoId: '5qap5aO4i9A',
    title: 'beats to sleep/chill to - peaceful lofi hip hop',
    artist: 'Lofi Girl',
    channelTitle: 'Lofi Girl',
    album: 'Deep REM Cycles',
    duration: 0,
    durationFormatted: 'LIVE',
    album_art: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
    youtube_url: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    embed_url: 'https://www.youtube.com/embed/5qap5aO4i9A',
    source: 'YouTube',
    description: 'Calm and sleepy lofi hip hop beats for nighttime relaxation.',
  },
  {
    id: 'S_MOd40zlTQ',
    videoId: 'S_MOd40zlTQ',
    title: 'Peaceful Acoustic Guitar Relaxation - Calm Guitar Melodies',
    artist: 'Acoustic Guitar BGM',
    channelTitle: 'Acoustic Guitar BGM',
    album: 'Folk & Nature Notes',
    duration: 7200,
    durationFormatted: '2:00:00',
    album_art: 'https://i.ytimg.com/vi/S_MOd40zlTQ/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/S_MOd40zlTQ/hqdefault.jpg',
    youtube_url: 'https://www.youtube.com/watch?v=S_MOd40zlTQ',
    embed_url: 'https://www.youtube.com/embed/S_MOd40zlTQ',
    source: 'YouTube',
    description: 'Warm acoustic guitar fingerpicking and calm folk instrumental melodies.',
  },
];

/**
 * Checks whether the YouTube Data API key is configured in the environment.
 */
export function isYouTubeConfigured(): boolean {
  return Boolean(config.YOUTUBE_API_KEY && config.YOUTUBE_API_KEY.trim().length > 0);
}

/**
 * Search YouTube using the official YouTube Data API v3.
 * Returns video items filtered for embeddability and music.
 */
export async function searchYouTubeTracks(queryText: string): Promise<YouTubeSearchResult> {
  const cleanQuery = queryText
    .replace(/^alexa[, ]*/i, '')
    .replace(/play the song|play song|play music|stream the song|stream song|play|stream|find|search for/gi, '')
    .replace(/on youtube|from youtube/gi, '')
    .trim();

  const lower = cleanQuery.toLowerCase();

  // Check if API key is missing
  if (!isYouTubeConfigured()) {
    // If user searched for a known featured theme, return matching featured tracks
    const matchedFeatured = YOUTUBE_FEATURED_TRACKS.filter(t => {
      const combined = `${t.title} ${t.artist} ${t.album || ''} ${t.description || ''}`.toLowerCase();
      return combined.includes(lower) || lower.split(' ').some(w => w.length > 2 && combined.includes(w));
    });

    if (matchedFeatured.length > 0) {
      return {
        tracks: matchedFeatured,
        configured: false,
        message: 'YouTube Data API key is not configured. Displaying matching featured embeddable YouTube streams.',
      };
    }

    return {
      tracks: [],
      configured: false,
      error: 'YOUTUBE_API_KEY_MISSING',
      message: 'YouTube Data API v3 key is not configured. To search YouTube dynamically, please add YOUTUBE_API_KEY to your server .env file.',
    };
  }

  try {
    // Query YouTube Data API v3 search
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('videoEmbeddable', 'true');
    searchUrl.searchParams.set('maxResults', '12');
    searchUrl.searchParams.set('q', cleanQuery || 'music');
    searchUrl.searchParams.set('key', config.YOUTUBE_API_KEY!);

    const res = await fetch(searchUrl.toString(), {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      if (res.status === 403) {
        return {
          tracks: [],
          configured: true,
          error: 'QUOTA_EXCEEDED',
          message: 'YouTube Data API daily quota limit exceeded. You can still play direct YouTube video IDs, or try again tomorrow.',
        };
      }
      const errText = await res.text();
      console.warn(`YouTube search error (${res.status}):`, errText);
      return {
        tracks: [],
        configured: true,
        error: `HTTP_${res.status}`,
        message: `YouTube search error: HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as any;
    const items = data.items || [];

    if (items.length === 0) {
      return {
        tracks: [],
        configured: true,
        message: `No matching embeddable YouTube videos found for "${cleanQuery}".`,
      };
    }

    // Extract video IDs to fetch duration & content details
    const videoIds = items.map((i: any) => i.id?.videoId).filter(Boolean);
    let detailsMap = new Map<string, { duration: number; durationFormatted: string }>();

    if (videoIds.length > 0) {
      try {
        const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
        videosUrl.searchParams.set('part', 'contentDetails,status');
        videosUrl.searchParams.set('id', videoIds.join(','));
        videosUrl.searchParams.set('key', config.YOUTUBE_API_KEY!);

        const detailsRes = await fetch(videosUrl.toString(), {
          signal: AbortSignal.timeout(5000),
        });

        if (detailsRes.ok) {
          const detailsData = (await detailsRes.json()) as any;
          for (const v of detailsData.items || []) {
            const rawDuration = v.contentDetails?.duration;
            const sec = parseIsoDuration(rawDuration);
            detailsMap.set(v.id, {
              duration: sec,
              durationFormatted: formatDuration(sec),
            });
          }
        }
      } catch (detailsErr: any) {
        console.warn('Could not fetch video details/durations:', detailsErr.message);
      }
    }

    const tracks: MusicTrack[] = items
      .filter((item: any) => !!item.id?.videoId)
      .map((item: any) => {
        const vId = item.id.videoId;
        const snippet = item.snippet || {};
        const title = decodeHtmlEntities(snippet.title || 'YouTube Video');
        const channelTitle = decodeHtmlEntities(snippet.channelTitle || 'YouTube Creator');
        const thumbnail =
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;

        const details = detailsMap.get(vId);

        return {
          id: vId,
          videoId: vId,
          title,
          artist: channelTitle,
          channelTitle,
          album: channelTitle,
          album_art: thumbnail,
          thumbnail,
          duration: details?.duration || 0,
          durationFormatted: details?.durationFormatted || 'Video',
          youtube_url: `https://www.youtube.com/watch?v=${vId}`,
          embed_url: `https://www.youtube.com/embed/${vId}`,
          source: 'YouTube',
          description: decodeHtmlEntities(snippet.description || ''),
          publishedAt: snippet.publishedAt,
        };
      });

    return {
      tracks,
      configured: true,
    };
  } catch (err: any) {
    console.error('YouTube search exception:', err.message);
    return {
      tracks: [],
      configured: true,
      error: 'NETWORK_ERROR',
      message: `Failed to connect to YouTube Data API: ${err.message}`,
    };
  }
}

/**
 * Retrieve current music playback status for user.
 */
export async function getPlaybackStatus(userId: string): Promise<PlaybackState> {
  const isConfigured = isYouTubeConfigured();

  const res = await query(
    `SELECT current_track, is_playing, progress_seconds, volume 
     FROM public.music_playback 
     WHERE user_id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    const defaultTrack = YOUTUBE_FEATURED_TRACKS[0];
    await query(
      `INSERT INTO public.music_playback (user_id, current_track, is_playing, progress_seconds, volume)
       VALUES ($1, $2, false, 0, 75)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, JSON.stringify(defaultTrack)]
    );
    return {
      current_track: defaultTrack,
      is_playing: false,
      progress_seconds: 0,
      volume: 75,
      queue: YOUTUBE_FEATURED_TRACKS,
      api_configured: isConfigured,
      message: isConfigured ? undefined : 'YouTube Data API key is not configured.',
    };
  }

  const row = res.rows[0];
  let currentTrack = row.current_track;

  // Validate track structure (upgrade legacy format if needed)
  if (!currentTrack || !currentTrack.videoId) {
    currentTrack = YOUTUBE_FEATURED_TRACKS[0];
  }

  return {
    current_track: currentTrack,
    is_playing: row.is_playing ?? false,
    progress_seconds: row.progress_seconds ?? 0,
    volume: row.volume ?? 75,
    queue: YOUTUBE_FEATURED_TRACKS,
    api_configured: isConfigured,
    message: isConfigured ? undefined : 'YouTube Data API key is not configured.',
  };
}

/**
 * Play a track by query, artist, genre, mood, videoId, or trackId.
 */
export async function playMusic(
  userId: string,
  options?: {
    query?: string;
    artist?: string;
    genre?: string;
    mood?: string;
    trackId?: string;
    videoId?: string;
  }
): Promise<PlaybackState> {
  let selectedTrack: MusicTrack = YOUTUBE_FEATURED_TRACKS[0];

  const targetId = options?.videoId || options?.trackId;

  if (targetId) {
    // 1. Direct match in featured tracks
    const directHit = YOUTUBE_FEATURED_TRACKS.find(t => t.id === targetId || t.videoId === targetId);
    if (directHit) {
      selectedTrack = directHit;
    } else {
      // Direct YouTube video ID passed
      selectedTrack = {
        id: targetId,
        videoId: targetId,
        title: options?.query || 'YouTube Music Video',
        artist: options?.artist || 'YouTube Creator',
        channelTitle: options?.artist || 'YouTube Creator',
        album: 'YouTube Playback',
        duration: 0,
        album_art: `https://i.ytimg.com/vi/${targetId}/hqdefault.jpg`,
        thumbnail: `https://i.ytimg.com/vi/${targetId}/hqdefault.jpg`,
        youtube_url: `https://www.youtube.com/watch?v=${targetId}`,
        embed_url: `https://www.youtube.com/embed/${targetId}`,
        source: 'YouTube',
      };
    }
  } else if (options?.query || options?.genre || options?.artist || options?.mood) {
    const searchTerms = [options.query, options.artist, options.genre, options.mood]
      .filter(Boolean)
      .join(' ')
      .trim();

    const lower = searchTerms.toLowerCase();

    // Check if query matches a featured genre or stream
    const featuredMatch = YOUTUBE_FEATURED_TRACKS.find(t => {
      const combined = `${t.title} ${t.artist} ${t.album || ''} ${t.description || ''}`.toLowerCase();
      return combined.includes(lower) || lower.split(' ').some(w => w.length > 2 && combined.includes(w));
    });

    if (featuredMatch && !isYouTubeConfigured()) {
      selectedTrack = featuredMatch;
    } else if (isYouTubeConfigured()) {
      // Search via YouTube Data API
      const searchRes = await searchYouTubeTracks(searchTerms);
      if (searchRes.tracks.length > 0) {
        selectedTrack = searchRes.tracks[0];
      } else if (featuredMatch) {
        selectedTrack = featuredMatch;
      }
    } else if (featuredMatch) {
      selectedTrack = featuredMatch;
    }
  }

  await query(
    `INSERT INTO public.music_playback (user_id, current_track, is_playing, progress_seconds, volume, updated_at)
     VALUES ($1, $2, true, 0, 75, NOW())
     ON CONFLICT (user_id) DO UPDATE 
     SET current_track = $2, is_playing = true, progress_seconds = 0, updated_at = NOW()`,
    [userId, JSON.stringify(selectedTrack)]
  );

  return {
    current_track: selectedTrack,
    is_playing: true,
    progress_seconds: 0,
    volume: 75,
    queue: [selectedTrack, ...YOUTUBE_FEATURED_TRACKS.filter(t => t.id !== selectedTrack.id)],
    api_configured: isYouTubeConfigured(),
  };
}

export async function pauseMusic(userId: string): Promise<PlaybackState> {
  const current = await getPlaybackStatus(userId);
  await query(
    `UPDATE public.music_playback 
     SET is_playing = false, updated_at = NOW() 
     WHERE user_id = $1`,
    [userId]
  );
  return { ...current, is_playing: false };
}

export async function resumeMusic(userId: string): Promise<PlaybackState> {
  const current = await getPlaybackStatus(userId);
  await query(
    `UPDATE public.music_playback 
     SET is_playing = true, updated_at = NOW() 
     WHERE user_id = $1`,
    [userId]
  );
  return { ...current, is_playing: true };
}

export async function nextTrack(userId: string): Promise<PlaybackState> {
  const current = await getPlaybackStatus(userId);
  const queue = current.queue && current.queue.length > 0 ? current.queue : YOUTUBE_FEATURED_TRACKS;
  const currentIndex = queue.findIndex(t => t.id === current.current_track?.id || t.videoId === current.current_track?.videoId);
  const nextIndex = (currentIndex + 1) % queue.length;
  const next = queue[nextIndex];

  await query(
    `UPDATE public.music_playback 
     SET current_track = $1, is_playing = true, progress_seconds = 0, updated_at = NOW() 
     WHERE user_id = $2`,
    [JSON.stringify(next), userId]
  );

  return { ...current, current_track: next, is_playing: true, progress_seconds: 0 };
}

export async function setVolume(userId: string, volume: number): Promise<PlaybackState> {
  const clamped = Math.max(0, Math.min(100, Math.round(volume)));
  await query(
    `UPDATE public.music_playback 
     SET volume = $1, updated_at = NOW() 
     WHERE user_id = $2`,
    [clamped, userId]
  );
  return await getPlaybackStatus(userId);
}
