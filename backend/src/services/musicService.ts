import { query } from '../db/supabase.js';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  album_art: string;
  genre: string;
  preview_url?: string;
  mood?: string;
}

export interface PlaybackState {
  current_track: MusicTrack;
  is_playing: boolean;
  progress_seconds: number;
  volume: number;
  queue: MusicTrack[];
}

// Curated high-fidelity music catalog for Alexa+
export const MUSIC_CATALOG: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'Midnight Chill Lo-Fi',
    artist: 'Alexa Beats Collective',
    album: 'Echo Sanctuary Vol. 1',
    duration: 184,
    album_art: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    genre: 'Lo-Fi / Study',
    mood: 'Focus & Relax',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: 'track-2',
    title: 'Electric Obsidian Skyline',
    artist: 'Cyan Resonance',
    album: 'Cyber Horizon 2026',
    duration: 215,
    album_art: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    genre: 'Synthwave / Electronic',
    mood: 'Energetic & Uplifting',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
  },
  {
    id: 'track-3',
    title: 'Rainy Cafe Acoustic Session',
    artist: 'Maya Lin & The Strings',
    album: 'Autumn Morning Notes',
    duration: 196,
    album_art: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    genre: 'Acoustic / Indie Folk',
    mood: 'Cozy & Peaceful',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=acoustic-guitars-ambient-10855.mp3',
  },
  {
    id: 'track-4',
    title: 'Deep Focus Classical Piano',
    artist: 'Valentin Richter',
    album: 'Nocturnes for Thought',
    duration: 242,
    album_art: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=600&auto=format&fit=crop&q=80',
    genre: 'Classical / Ambient Piano',
    mood: 'Deep Concentration',
    preview_url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8340d02d05.mp3?filename=piano-moment-9835.mp3',
  },
  {
    id: 'track-5',
    title: 'Sun-Drenched Coastal Jazz',
    artist: 'The Blue Note Trio',
    album: 'Mediterranean Sunset',
    duration: 208,
    album_art: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    genre: 'Smooth Jazz / Lounge',
    mood: 'Sophisticated & Breezy',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_0cb3fdadba.mp3?filename=smooth-jazz-lounge-126292.mp3',
  },
  {
    id: 'track-6',
    title: 'Atmospheric Sleep Waves',
    artist: 'Aura Soundscapes',
    album: 'Deep REM Cycles',
    duration: 320,
    album_art: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    genre: 'Meditation / Sleep',
    mood: 'Dreamy & Restful',
    preview_url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=meditation-relaxing-ambient-116345.mp3',
  },
];

export async function getPlaybackStatus(userId: string): Promise<PlaybackState> {
  const res = await query(
    `SELECT current_track, is_playing, progress_seconds, volume 
     FROM public.music_playback 
     WHERE user_id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    const defaultTrack = MUSIC_CATALOG[0];
    await query(
      `INSERT INTO public.music_playback (user_id, current_track, is_playing, progress_seconds, volume)
       VALUES ($1, $2, false, 0, 70)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, JSON.stringify(defaultTrack)]
    );
    return {
      current_track: defaultTrack,
      is_playing: false,
      progress_seconds: 0,
      volume: 70,
      queue: MUSIC_CATALOG,
    };
  }

  const row = res.rows[0];
  return {
    current_track: row.current_track || MUSIC_CATALOG[0],
    is_playing: row.is_playing ?? false,
    progress_seconds: row.progress_seconds ?? 0,
    volume: row.volume ?? 70,
    queue: MUSIC_CATALOG,
  };
}

export async function playMusic(
  userId: string,
  options?: {
    query?: string;
    artist?: string;
    genre?: string;
    mood?: string;
    trackId?: string;
  }
): Promise<PlaybackState> {
  let selectedTrack = MUSIC_CATALOG[0];

  if (options?.trackId) {
    const match = MUSIC_CATALOG.find(t => t.id === options.trackId);
    if (match) selectedTrack = match;
  } else if (options?.query || options?.genre || options?.artist || options?.mood) {
    const searchTerms = [options.query, options.genre, options.artist, options.mood]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const match = MUSIC_CATALOG.find(t => {
      const combined = `${t.title} ${t.artist} ${t.album} ${t.genre} ${t.mood}`.toLowerCase();
      return combined.includes(searchTerms) || searchTerms.split(' ').some(w => combined.includes(w));
    });

    if (match) selectedTrack = match;
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
    queue: MUSIC_CATALOG,
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
  const currentIndex = MUSIC_CATALOG.findIndex(t => t.id === current.current_track.id);
  const nextIndex = (currentIndex + 1) % MUSIC_CATALOG.length;
  const next = MUSIC_CATALOG[nextIndex];

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
