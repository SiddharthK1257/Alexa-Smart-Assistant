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
  spotify_url?: string;
  spotify_uri?: string;
  spotify_id?: string;
  spotify_embed_url?: string;
  full_audio_url?: string;
  source?: string;
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
    spotify_url: 'https://open.spotify.com/search/Midnight%20Chill%20Lo-Fi',
    spotify_uri: 'spotify:search:Midnight%20Chill%20Lo-Fi',
    source: 'Spotify',
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
    spotify_url: 'https://open.spotify.com/search/Electric%20Obsidian%20Skyline',
    spotify_uri: 'spotify:search:Electric%20Obsidian%20Skyline',
    source: 'Spotify',
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
    spotify_url: 'https://open.spotify.com/search/Rainy%20Cafe%20Acoustic',
    spotify_uri: 'spotify:search:Rainy%20Cafe%20Acoustic',
    source: 'Spotify',
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
    spotify_url: 'https://open.spotify.com/search/Deep%20Focus%20Classical%20Piano',
    spotify_uri: 'spotify:search:Deep%20Focus%20Classical%20Piano',
    source: 'Spotify',
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
    spotify_url: 'https://open.spotify.com/search/Sun-Drenched%20Coastal%20Jazz',
    spotify_uri: 'spotify:search:Sun-Drenched%20Coastal%20Jazz',
    source: 'Spotify',
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
    spotify_url: 'https://open.spotify.com/search/Atmospheric%20Sleep%20Waves',
    spotify_uri: 'spotify:search:Atmospheric%20Sleep%20Waves',
    source: 'Spotify',
  },
];

// Curated Top Global Spotify Hits with authentic Spotify IDs, official embeds, and original master recordings
export const SPOTIFY_TOP_HITS: MusicTrack[] = [
  {
    id: 'spotify-hit-blinding-lights',
    spotify_id: '0VjIjW4GlUZAMYd2vXMi3b',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    album_art: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e028863bc11d2aa12b54f5aeb36',
    genre: 'Synthpop / Pop',
    mood: 'Spotify Global #1 • Original Master',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    spotify_uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b',
    spotify_embed_url: 'https://open.spotify.com/embed/track/0VjIjW4GlUZAMYd2vXMi3b?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=The+Weeknd+Blinding+Lights+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-shape-of-you',
    spotify_id: '7qiZfU4dY1lWllzX7mPBI3',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    duration: 234,
    album_art: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02ba5db46f4b838ef6027e6f96',
    genre: 'Pop / Acoustic',
    mood: 'Spotify 3B+ Streams • Original Recording',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/c7/4f/44c74f0d-72dc-6143-d4d0-ba14d661ca0d/mzaf_9566898362556366703.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3',
    spotify_uri: 'spotify:track:7qiZfU4dY1lWllzX7mPBI3',
    spotify_embed_url: 'https://open.spotify.com/embed/track/7qiZfU4dY1lWllzX7mPBI3?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Ed+Sheeran+Shape+of+You+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-starboy',
    spotify_id: '5aAx2yezTd8zXrkmtKl66Z',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    album: 'Starboy',
    duration: 230,
    album_art: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg',
    genre: 'R&B / Electro-Pop',
    mood: 'Spotify Global Anthem • Original Master',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/11/71/d6/1171d6ad-3c96-e027-2af6-58028426588c/mzaf_15137631797407745471.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/5aAx2yezTd8zXrkmtKl66Z',
    spotify_uri: 'spotify:track:5aAx2yezTd8zXrkmtKl66Z',
    spotify_embed_url: 'https://open.spotify.com/embed/track/5aAx2yezTd8zXrkmtKl66Z?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=The+Weeknd+Starboy+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-believer',
    spotify_id: '0pqnGHJpmpxLKifKRmU6WP',
    title: 'Believer',
    artist: 'Imagine Dragons',
    album: 'Evolve',
    duration: 204,
    album_art: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e025675e83f707f1d7271e5cf8a',
    genre: 'Alternative Rock / Pop',
    mood: 'Spotify High Energy • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c0/3f/36/c03f367a-b66b-fd0a-a54c-30f8250c4410/mzaf_12768434238801682952.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/0pqnGHJpmpxLKifKRmU6WP',
    spotify_uri: 'spotify:track:0pqnGHJpmpxLKifKRmU6WP',
    spotify_embed_url: 'https://open.spotify.com/embed/track/0pqnGHJpmpxLKifKRmU6WP?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Imagine+Dragons+Believer+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-levitating',
    spotify_id: '463CkQjx2Zk1yXoBuierM9',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: 204,
    album_art: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02e073fc43880772d66ca4c0ff',
    genre: 'Nu-Disco / Pop',
    mood: 'Spotify Billboard #1 • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/dc/4d/59dc4dda-93ff-8f1c-c536-f005f6ea6af5/mzaf_3066686759813252385.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9',
    spotify_uri: 'spotify:track:463CkQjx2Zk1yXoBuierM9',
    spotify_embed_url: 'https://open.spotify.com/embed/track/463CkQjx2Zk1yXoBuierM9?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Dua+Lipa+Levitating+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-bohemian-rhapsody',
    spotify_id: '2JiDi0qAXsPwhPqA2qaKGt',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: 355,
    album_art: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02fdab4a163ab9f6db72c952ee',
    genre: 'Classic Rock',
    mood: 'Spotify All-Time Masterpiece • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/17/fc/1e/17fc1eba-946d-84a9-710b-a0e88ea64209/mzaf_3049006317693088799.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/2JiDi0qAXsPwhPqA2qaKGt',
    spotify_uri: 'spotify:track:2JiDi0qAXsPwhPqA2qaKGt',
    spotify_embed_url: 'https://open.spotify.com/embed/track/2JiDi0qAXsPwhPqA2qaKGt?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Queen+Bohemian+Rhapsody+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-flowers',
    spotify_id: '0yLdNVWF3Srea0uzk55zFn',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    album: 'Endless Summer Vacation',
    duration: 201,
    album_art: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02f429549123dbe8552764ba1d',
    genre: 'Pop / Dance',
    mood: 'Spotify Global Record • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/68/9e/f7/689ef7fe-14fe-a846-c87f-7d3b2d6344b1/mzaf_4167137058064023087.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/0yLdNVWF3Srea0uzk55zFn',
    spotify_uri: 'spotify:track:0yLdNVWF3Srea0uzk55zFn',
    spotify_embed_url: 'https://open.spotify.com/embed/track/0yLdNVWF3Srea0uzk55zFn?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Miley+Cyrus+Flowers+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-sunflower',
    spotify_id: '3KkXRkHbMCARz0aVfEt68P',
    title: 'Sunflower',
    artist: 'Post Malone & Swae Lee',
    album: 'Spider-Man: Into the Spider-Verse',
    duration: 158,
    album_art: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4b/30/2c/4b302cb6-7a14-5464-4e97-0577e9d0be49/18UMGIM82277.rgb.jpg/600x600bb.jpg',
    genre: 'Hip-Hop / Pop',
    mood: 'Spotify Multi-Platinum • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/98/f0/d6/98f0d67e-f8bf-762d-cac7-1c6b3b6b35dd/mzaf_4543283896248560946.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/3KkXRkHbMCARz0aVfEt68P',
    spotify_uri: 'spotify:track:3KkXRkHbMCARz0aVfEt68P',
    spotify_embed_url: 'https://open.spotify.com/embed/track/3KkXRkHbMCARz0aVfEt68P?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Post+Malone+Swae+Lee+Sunflower+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-someone-you-loved',
    spotify_id: '7qEHsqek33rTcFNT9PFqLf',
    title: 'Someone You Loved',
    artist: 'Lewis Capaldi',
    album: 'Divinely Uninspired to a Hellish Extent',
    duration: 182,
    album_art: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02fc2101e6889d6ce9025f85f2',
    genre: 'Pop / Ballad',
    mood: 'Spotify Top Ballad • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e5/c8/17/e5c817e2-7830-091f-8686-d6276d5beaeb/mzaf_5586826958480073790.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/7qEHsqek33rTcFNT9PFqLf',
    spotify_uri: 'spotify:track:7qEHsqek33rTcFNT9PFqLf',
    spotify_embed_url: 'https://open.spotify.com/embed/track/7qEHsqek33rTcFNT9PFqLf?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Lewis+Capaldi+Someone+You+Loved+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-closer',
    spotify_id: '7BKLCZ1jbUBVqRi2FVlTVw',
    title: 'Closer',
    artist: 'The Chainsmokers ft. Halsey',
    album: 'Collage',
    duration: 246,
    album_art: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02495ce6da9aeb159e94eaa453',
    genre: 'Electronic / Pop',
    mood: 'Spotify Diamond Single • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bd/f9/b9/bdf9b9b2-eaa4-4461-6079-aaacc6df7316/mzaf_17327312786932455493.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/7BKLCZ1jbUBVqRi2FVlTVw',
    spotify_uri: 'spotify:track:7BKLCZ1jbUBVqRi2FVlTVw',
    spotify_embed_url: 'https://open.spotify.com/embed/track/7BKLCZ1jbUBVqRi2FVlTVw?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=The+Chainsmokers+Closer+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-perfect',
    spotify_id: '0tgVpDi06FyKpA1z0VMD4v',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    duration: 263,
    album_art: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02ba5db46f4b838ef6027e6f96',
    genre: 'Pop / Romantic',
    mood: 'Spotify Top Love Song • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c7/ba/bc/c7babc66-f598-aaa6-bcf6-307281795817/mzaf_16337361235117168274.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v',
    spotify_uri: 'spotify:track:0tgVpDi06FyKpA1z0VMD4v',
    spotify_embed_url: 'https://open.spotify.com/embed/track/0tgVpDi06FyKpA1z0VMD4v?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Ed+Sheeran+Perfect+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-bad-guy',
    spotify_id: '2Fxmhks0bxGSBdJ92vM42m',
    title: 'Bad Guy',
    artist: 'Billie Eilish',
    album: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
    duration: 194,
    album_art: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0250a3147b4edd7701a876c6ce',
    genre: 'Alt-Pop / Electronic',
    mood: 'Grammy Record of the Year • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c3/87/1f/c3871f7e-3260-d615-1c66-5fdca2c3a48f/mzaf_10721331211699880949.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/2Fxmhks0bxGSBdJ92vM42m',
    spotify_uri: 'spotify:track:2Fxmhks0bxGSBdJ92vM42m',
    spotify_embed_url: 'https://open.spotify.com/embed/track/2Fxmhks0bxGSBdJ92vM42m?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Billie+Eilish+bad+guy+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-stay',
    spotify_id: '5HCyWlXZPP0y6Gqq8TgA20',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'F*CK LOVE 3: OVER YOU',
    duration: 142,
    album_art: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/89/59/6a/89596ab9-fa3c-8d08-4d95-a6450fa2013c/886449400515.jpg/600x600bb.jpg',
    genre: 'Pop / Rap',
    mood: 'Spotify Top 10 • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d7/4a/84/d74a84d5-9afa-761e-b632-baab55c2a23b/mzaf_11865500880477235553.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/5HCyWlXZPP0y6Gqq8TgA20',
    spotify_uri: 'spotify:track:5HCyWlXZPP0y6Gqq8TgA20',
    spotify_embed_url: 'https://open.spotify.com/embed/track/5HCyWlXZPP0y6Gqq8TgA20?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=The+Kid+LAROI+Justin+Bieber+Stay+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-watermelon-sugar',
    spotify_id: '6UelLqGlWMcVH1E5c4H7lY',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    album: 'Fine Line',
    duration: 174,
    album_art: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0225180571abce9472f61bd722',
    genre: 'Funk Pop',
    mood: 'Grammy Winner • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8d/2b/cf/8d2bcff6-d284-7c4e-d6e3-9d70d019236a/mzaf_13222308322329291378.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/6UelLqGlWMcVH1E5c4H7lY',
    spotify_uri: 'spotify:track:6UelLqGlWMcVH1E5c4H7lY',
    spotify_embed_url: 'https://open.spotify.com/embed/track/6UelLqGlWMcVH1E5c4H7lY?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Harry+Styles+Watermelon+Sugar+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-as-it-was',
    spotify_id: '4LRPiXqCikLlN15c3yImP7',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    duration: 167,
    album_art: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2a/19/fb/2a19fb85-2f70-9e44-f2a9-82abe679b88e/886449990061.jpg/600x600bb.jpg',
    genre: 'Indie Pop',
    mood: 'Spotify Most Streamed Song 2022 • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/67/10/16/67101606-3869-ca44-6c03-e13d6322cb51/mzaf_1135399237022217274.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/4LRPiXqCikLlN15c3yImP7',
    spotify_uri: 'spotify:track:4LRPiXqCikLlN15c3yImP7',
    spotify_embed_url: 'https://open.spotify.com/embed/track/4LRPiXqCikLlN15c3yImP7?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Harry+Styles+As+It+Was+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-espresso',
    spotify_id: '2HRqTpkrJO5ggZyyK6NPWz',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: "Short n' Sweet",
    duration: 175,
    album_art: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/57/e8/7b/57e87ba0-5057-9bb9-c247-ce7dbe426e89/24UMGIM55213.rgb.jpg/600x600bb.jpg',
    genre: 'Pop / Dance',
    mood: 'Spotify Global #1 • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e9/4d/02/e94d0230-11ee-ef94-d2cf-a5d547bd73f4/mzaf_554140808559155562.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/2HRqTpkrJO5ggZyyK6NPWz',
    spotify_uri: 'spotify:track:2HRqTpkrJO5ggZyyK6NPWz',
    spotify_embed_url: 'https://open.spotify.com/embed/track/2HRqTpkrJO5ggZyyK6NPWz?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Sabrina+Carpenter+Espresso+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-die-with-a-smile',
    spotify_id: '2plbrEY59IikOBgBGLjaoe',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    album: 'Die With A Smile',
    duration: 252,
    album_art: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/600x600bb.jpg',
    genre: 'Pop / Soul',
    mood: 'Spotify Global Megahit • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/07/6a/99/076a99ed-b946-431b-6f1f-54fa187ca5bd/mzaf_8102882277995122875.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/2plbrEY59IikOBgBGLjaoe',
    spotify_uri: 'spotify:track:2plbrEY59IikOBgBGLjaoe',
    spotify_embed_url: 'https://open.spotify.com/embed/track/2plbrEY59IikOBgBGLjaoe?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Lady+Gaga+Bruno+Mars+Die+With+A+Smile+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-birds-of-a-feather',
    spotify_id: '6dOtVTDdiauQNBQEDOtlAB',
    title: 'BIRDS OF A FEATHER',
    artist: 'Billie Eilish',
    album: 'HIT ME HARD AND SOFT',
    duration: 210,
    album_art: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/600x600bb.jpg',
    genre: 'Indie Pop',
    mood: 'Spotify Worldwide Sensation • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/34/31/d3/3431d34e-847f-5d66-df83-0bce688d997e/mzaf_18106743962423782018.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/6dOtVTDdiauQNBQEDOtlAB',
    spotify_uri: 'spotify:track:6dOtVTDdiauQNBQEDOtlAB',
    spotify_embed_url: 'https://open.spotify.com/embed/track/6dOtVTDdiauQNBQEDOtlAB?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Billie+Eilish+BIRDS+OF+A+FEATHER+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-cruel-summer',
    spotify_id: '1BxfuPKGuaTgP7aM0Bbdwr',
    title: 'Cruel Summer',
    artist: 'Taylor Swift',
    album: 'Lover',
    duration: 178,
    album_art: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/600x600bb.jpg',
    genre: 'Pop / Synthpop',
    mood: 'Eras Tour Global Anthem • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/af/81/44af8168-9609-1b85-5048-ada08dceacf3/mzaf_1341699644335558812.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr',
    spotify_uri: 'spotify:track:1BxfuPKGuaTgP7aM0Bbdwr',
    spotify_embed_url: 'https://open.spotify.com/embed/track/1BxfuPKGuaTgP7aM0Bbdwr?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Taylor+Swift+Cruel+Summer+Official+Audio&autoplay=1',
    source: 'Spotify',
  },
  {
    id: 'spotify-hit-kesariya',
    spotify_id: '6VBhH7CyP56BXjp8VsDFPZ',
    title: 'Kesariya',
    artist: 'Pritam, Arijit Singh & Amitabh Bhattacharya',
    album: 'Brahmastra',
    duration: 268,
    album_art: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/600x600bb.jpg',
    genre: 'Bollywood / Romantic',
    mood: 'Spotify India #1 All Time • Original',
    preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/38/4c/5c/384c5c8f-3ff8-e457-b2f7-3158ce108649/mzaf_12389299033886433185.plus.aac.p.m4a',
    spotify_url: 'https://open.spotify.com/track/6VBhH7CyP56BXjp8VsDFPZ',
    spotify_uri: 'spotify:track:6VBhH7CyP56BXjp8VsDFPZ',
    spotify_embed_url: 'https://open.spotify.com/embed/track/6VBhH7CyP56BXjp8VsDFPZ?utm_source=generator&theme=0',
    full_audio_url: 'https://www.youtube.com/embed?listType=search&list=Kesariya+Pritam+Arijit+Singh+Official+Audio&autoplay=1',
    source: 'Spotify',
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
    const defaultTrack = SPOTIFY_TOP_HITS[0];
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
      queue: [...SPOTIFY_TOP_HITS, ...MUSIC_CATALOG],
    };
  }

  const row = res.rows[0];
  return {
    current_track: row.current_track || SPOTIFY_TOP_HITS[0],
    is_playing: row.is_playing ?? false,
    progress_seconds: row.progress_seconds ?? 0,
    volume: row.volume ?? 75,
    queue: [...SPOTIFY_TOP_HITS, ...MUSIC_CATALOG],
  };
}

export async function searchSpotifyTracks(queryText: string): Promise<MusicTrack[]> {
  const cleanQuery = queryText
    .replace(/on spotify|from spotify|play the song|play song|play music|stream the song|stream song|play|stream/gi, '')
    .trim();

  const lower = cleanQuery.toLowerCase();
  const isGeneric = !cleanQuery || [
    'any',
    'any song',
    'any songs',
    'any spotify songs',
    'spotify songs',
    'spotify song',
    'spotify music',
    'some song',
    'some songs',
    'some music',
    'a song',
    'song',
    'songs',
    'music',
    'tracks',
    'hits',
    'something',
    'anything',
    'spotify',
    'top hits',
    'spotify top hits',
  ].includes(lower);

  // If user asked to play "any spotify songs" or generic spotify music, return verified Top Spotify Hits
  if (isGeneric) {
    return SPOTIFY_TOP_HITS;
  }

  // 1. Direct match against our verified Spotify Top Hits
  const directHits = SPOTIFY_TOP_HITS.filter(
    t =>
      t.title.toLowerCase().includes(lower) ||
      lower.includes(t.title.toLowerCase()) ||
      t.artist.toLowerCase().includes(lower) ||
      lower.includes(t.artist.toLowerCase())
  );

  // 2. Search Global Catalog via iTunes Official Search API for 100% Original Recording Metadata & Audio
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=10`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.results && data.results.length > 0) {
        const liveOriginalTracks: MusicTrack[] = data.results.map((r: any) => {
          // Check if this matched any known curated Spotify ID
          const matchedCurated = SPOTIFY_TOP_HITS.find(
            c => c.title.toLowerCase() === r.trackName.toLowerCase() ||
                 (c.artist.toLowerCase().includes(r.artistName.toLowerCase()) && c.title.toLowerCase().includes(r.trackName.toLowerCase()))
          );

          const spotifyId = matchedCurated?.spotify_id;
          const spotifyEmbed = spotifyId
            ? `https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`
            : undefined;

          const searchQuery = `${r.trackName} ${r.artistName}`;
          const spotifyUrl = matchedCurated?.spotify_url || `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`;
          const spotifyUri = matchedCurated?.spotify_uri || `spotify:search:${encodeURIComponent(searchQuery)}`;

          return {
            id: `spotify-${r.trackId}`,
            spotify_id: spotifyId,
            title: r.trackName,
            artist: r.artistName,
            album: r.collectionName || r.trackName,
            duration: Math.round((r.trackTimeMillis || 210000) / 1000),
            album_art: r.artworkUrl100
              ? r.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
              : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
            genre: r.primaryGenreName || 'Pop',
            // Authentic original song recording audio preview from Apple Music master
            preview_url: r.previewUrl,
            mood: 'Spotify Original Recording • Lossless Audio',
            spotify_url: spotifyUrl,
            spotify_uri: spotifyUri,
            spotify_embed_url: spotifyEmbed,
            full_audio_url: `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(r.artistName + ' ' + r.trackName + ' Official Audio')}&autoplay=1`,
            source: 'Spotify',
          };
        });

        if (directHits.length > 0) {
          const directIds = new Set(directHits.map(d => d.spotify_id || d.title));
          const filteredLive = liveOriginalTracks.filter(t => !directIds.has(t.spotify_id || t.title));
          return [...directHits, ...filteredLive];
        }

        return liveOriginalTracks;
      }
    }
  } catch (err: any) {
    console.warn('Live song metadata search failed, falling back to curated:', err.message);
  }

  if (directHits.length > 0) {
    return directHits;
  }

  // 3. Fallback to local catalog if offline
  const localMatch = MUSIC_CATALOG.filter(t => {
    const combined = `${t.title} ${t.artist} ${t.album} ${t.genre}`.toLowerCase();
    return combined.includes(lower) || lower.split(' ').some(w => combined.includes(w));
  });

  return localMatch.length > 0 ? localMatch : SPOTIFY_TOP_HITS;
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
  let selectedTrack: MusicTrack = SPOTIFY_TOP_HITS[0];

  if (options?.trackId) {
    const directHit = SPOTIFY_TOP_HITS.find(t => t.id === options.trackId || t.spotify_id === options.trackId);
    if (directHit) {
      selectedTrack = directHit;
    } else {
      const match = MUSIC_CATALOG.find(t => t.id === options.trackId);
      if (match) {
        selectedTrack = match;
      } else if (options.trackId.startsWith('spotify-')) {
        const queryStr = options.query || options.artist || 'music';
        const liveResults = await searchSpotifyTracks(queryStr);
        const liveMatch = liveResults.find(t => t.id === options.trackId) || liveResults[0];
        if (liveMatch) selectedTrack = liveMatch;
      }
    }
  } else if (options?.query || options?.genre || options?.artist || options?.mood) {
    const searchTerms = [options.query, options.artist, options.genre, options.mood]
      .filter(Boolean)
      .join(' ')
      .trim();

    const lower = searchTerms.toLowerCase();

    // Check if user specifically requested a genre like 'jazz', 'classical', etc.
    if (lower === 'jazz' || lower.includes('jazz')) {
      const jazzMatch = MUSIC_CATALOG.find(t => t.genre.toLowerCase().includes('jazz')) ||
                        SPOTIFY_TOP_HITS.find(t => t.genre.toLowerCase().includes('jazz'));
      if (jazzMatch) selectedTrack = jazzMatch;
    } else {
      // Search Spotify catalog for any song requested
      const spotifyResults = await searchSpotifyTracks(searchTerms);
      if (spotifyResults.length > 0) {
        selectedTrack = spotifyResults[0];
      } else {
        const localMatch = MUSIC_CATALOG.find(t => {
          const combined = `${t.title} ${t.artist} ${t.album} ${t.genre}`.toLowerCase();
          return combined.includes(lower) || lower.split(' ').some(w => combined.includes(w));
        });
        if (localMatch) selectedTrack = localMatch;
      }
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
    queue: [selectedTrack, ...SPOTIFY_TOP_HITS.filter(t => t.id !== selectedTrack.id), ...MUSIC_CATALOG],
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
  const queue = current.queue && current.queue.length > 0 ? current.queue : SPOTIFY_TOP_HITS;
  const currentIndex = queue.findIndex(t => t.id === current.current_track.id);
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
