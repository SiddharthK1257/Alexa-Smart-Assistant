import React from 'react';
import {
  Play,
  Pause,
  Disc3,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Cpu,
  Clock,
  Plus,
  Hotel,
  UtensilsCrossed,
  ExternalLink,
  MapPin,
  Flame,
  Youtube,
} from 'lucide-react';
import { ToolExecution, MusicTrack } from '../services/api';

interface AssistantActionCardProps {
  tool: ToolExecution;
  onSendMessage?: (msg: string) => void;
}

export const AssistantActionCard: React.FC<AssistantActionCardProps> = ({ tool, onSendMessage }) => {
  if (tool.status !== 'success' || !tool.result) return null;

  // 1. 🎵 YOUTUBE MUSIC PLAYBACK CARD
  if (tool.name === 'play_music') {
    const track: MusicTrack = tool.result.current_track;
    if (!track) return null;
    const videoId = track.videoId || track.id;
    const embedUrl = track.embed_url || `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
    const watchUrl = track.youtube_url || `https://www.youtube.com/watch?v=${videoId}`;

    return (
      <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#111c38] to-[#1E1B4B] border border-cyan-500/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-cyan-500/30 relative bg-black">
              <img
                src={track.thumbnail || track.album_art || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                alt={track.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Disc3 className="w-5 h-5 text-cyan-300 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-extrabold border border-red-500/30 flex items-center gap-1">
                  <Youtube className="w-2.5 h-2.5 fill-red-500" />
                  YOUTUBE
                </span>
                <span className="text-[10px] text-cyan-300 font-semibold truncate">
                  {track.channelTitle || track.artist}
                </span>
              </div>
              <h4 className="font-bold text-xs text-white truncate">{track.title}</h4>
              <p className="text-[11px] text-gray-300 truncate">Official YouTube Music Video</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Open on YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">YouTube</span>
            </a>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('music-status-updated', {
                    detail: { current_track: track, is_playing: !tool.result.is_playing },
                  })
                );
                if (onSendMessage) {
                  onSendMessage(tool.result.is_playing ? 'pause music' : 'resume music');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              {tool.result.is_playing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{tool.result.is_playing ? 'Pause' : 'Play'}</span>
            </button>
          </div>
        </div>

        {/* Embedded Official YouTube Player */}
        <div className="overflow-hidden rounded-xl border border-cyan-500/30 shadow-lg aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            title={`YouTube: ${track.title}`}
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  // 1b. 🔍 YOUTUBE MUSIC SEARCH RESULTS CARD
  if (tool.name === 'search_music') {
    const tracks: MusicTrack[] = tool.result.tracks || [];
    if (tracks.length === 0) return null;

    return (
      <div className="mt-3 p-4 rounded-2xl bg-[#0F172A] border border-cyan-500/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
            <Youtube className="w-4 h-4 text-red-500 fill-red-500" />
            <span>YouTube Music Search Results</span>
          </div>
          <span className="text-[10px] text-gray-400">{tracks.length} videos found</span>
        </div>

        <div className="space-y-2">
          {tracks.slice(0, 4).map((t, idx) => (
            <div
              key={t.videoId || idx}
              className="flex items-center justify-between p-2 rounded-xl bg-[#0B0F19]/80 border border-gray-800 hover:border-gray-700 transition-all gap-3"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={t.thumbnail || t.album_art || `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg`}
                  alt={t.title}
                  className="w-10 h-8 rounded-lg object-cover shrink-0 bg-black"
                />
                <div className="overflow-hidden">
                  <h5 className="text-xs font-bold text-white truncate">{t.title}</h5>
                  <p className="text-[10px] text-gray-400 truncate">{t.channelTitle || t.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (onSendMessage) {
                      onSendMessage(`Play ${t.title}`);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[11px] flex items-center gap-1 transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play</span>
                </button>
                <a
                  href={t.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  title="Open on YouTube"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. 🍳 RECIPE & ALLERGEN SAFETY CARDS (with photography for any dishes)
  if (tool.name === 'search_recipes' || tool.name === 'get_recipe_details') {
    const recipes = Array.isArray(tool.result) ? tool.result : [tool.result];
    if (recipes.length === 0 || !recipes[0]) return null;

    return (
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recipes.slice(0, 2).map((recipe: any) => {
            const isSafe = recipe.allergenSafety?.safetyRating === 'Safe for All';
            return (
              <div
                key={recipe.id}
                className="rounded-2xl bg-[#0F172A] border border-cyan-500/40 overflow-hidden shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-36 w-full">
                    <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md ${
                          isSafe
                            ? 'bg-emerald-950/80 border border-emerald-400/50 text-emerald-300'
                            : 'bg-amber-950/80 border border-amber-400/50 text-amber-300'
                        }`}
                      >
                        {isSafe ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> : <ShieldAlert className="w-3 h-3 text-amber-400" />}
                        <span>{isSafe ? 'Safe for All' : 'Contains Allergens'}</span>
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-3 right-3">
                      <span className="text-[10px] font-semibold text-cyan-300 block">{recipe.cuisine}</span>
                      <h4 className="font-bold text-xs text-white truncate">{recipe.title}</h4>
                    </div>
                  </div>

                  <div className="p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-gray-300">
                      <span className="flex items-center gap-1 font-mono text-cyan-400">
                        <Clock className="w-3 h-3" /> {recipe.totalTime}
                      </span>
                      <span className="text-orange-300 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> {recipe.caloriesPerServing} kcal
                      </span>
                    </div>

                    <div
                      className={`p-2 rounded-xl text-[10px] space-y-0.5 ${
                        isSafe ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200' : 'bg-amber-950/40 border border-amber-500/30 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="truncate">Safety & Allergen Profile:</span>
                      </div>
                      <p className="line-clamp-2 leading-tight">{recipe.allergenSafety?.safetyNotice}</p>
                    </div>
                  </div>
                </div>

                <div className="px-3 pb-3">
                  <button
                    type="button"
                    onClick={() => onSendMessage && onSendMessage(`Show step-by-step instructions for ${recipe.title}`)}
                    className="w-full py-1.5 rounded-xl bg-gray-800 hover:bg-cyan-500 hover:text-black text-cyan-300 font-semibold text-[11px] transition-all text-center"
                  >
                    Start Cooking with Alexa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. 📱 DEVICE DISCOVERY & CONNECTION CARD
  if (tool.name === 'discover_devices') {
    const suggestions = tool.result.suggestedDevices?.slice(0, 3) || [];
    return (
      <div className="mt-3 p-3.5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-cyan-300 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Nearby Compatible Devices
          </span>
          <span className="text-[10px] text-gray-400">{suggestions.length} Found</span>
        </div>
        <div className="space-y-2">
          {suggestions.map((sug: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-gray-800 text-xs"
            >
              <div>
                <h5 className="font-bold text-white text-[11px]">{sug.name}</h5>
                <p className="text-[10px] text-gray-400">{sug.room} • {sug.protocol}</p>
              </div>
              <button
                type="button"
                onClick={() => onSendMessage && onSendMessage(`connect to ${sug.name}`)}
                className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Pair</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. 🍽️ OPENTABLE RESTAURANT RESERVATION & SEARCH CARDS
  if (tool.name === 'book_restaurant' || tool.name === 'search_restaurants') {
    if (tool.name === 'book_restaurant') {
      const resv = tool.result.reservation;
      return (
        <div className="mt-3 rounded-2xl bg-[#0F172A] border border-red-500/40 overflow-hidden shadow-xl space-y-3">
          <div className="relative h-28 w-full">
            <img src={resv.image_url} alt={resv.restaurant_name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/50 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>OpenTable Confirmed</span>
            </div>
            <div className="absolute bottom-2 left-3">
              <h4 className="font-bold text-sm text-white">{resv.restaurant_name}</h4>
              <p className="text-[10px] text-gray-300">{resv.location}</p>
            </div>
          </div>

          <div className="px-3.5 pb-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-gray-300 text-[11px]">
              <span>Date: <strong>{resv.reservation_date} at {resv.reservation_time}</strong></span>
              <span>Party: <strong>{resv.party_size} Guests</strong></span>
            </div>
            <div className="p-2 rounded-xl bg-black/50 border border-gray-800 flex items-center justify-between text-[11px] font-mono text-cyan-300">
              <span>Code: {resv.confirmation_code}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Synced to Calendar
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (tool.name === 'search_restaurants') {
      const rests = Array.isArray(tool.result) ? tool.result : [];
      if (rests.length === 0) return null;
      return (
        <div className="mt-3 space-y-2.5">
          <span className="font-bold text-red-400 flex items-center gap-1.5 text-xs">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            OpenTable Partner Restaurants
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {rests.slice(0, 2).map((r: any) => (
              <div key={r.id} className="rounded-xl bg-[#0F172A] border border-red-500/30 overflow-hidden shadow-lg flex flex-col justify-between">
                <div className="relative h-28 w-full">
                  <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-300">
                    ⭐ {r.rating} ({r.reviewsCount})
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-[9px] text-cyan-300 font-semibold">{r.cuisine} • {r.priceRange}</span>
                    <h5 className="font-bold text-xs text-white truncate">{r.name}</h5>
                  </div>
                </div>
                <div className="p-2.5 space-y-2 text-xs">
                  <p className="text-[10px] text-gray-300 line-clamp-2">{r.description}</p>
                  <button
                    type="button"
                    onClick={() => onSendMessage && onSendMessage(`Book a table at ${r.name}`)}
                    className="w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] transition-all"
                  >
                    Reserve on OpenTable
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // 5. 🏨 HOTEL BOOKING & SEARCH CARDS
  if (tool.name === 'book_hotel' || tool.name === 'search_hotels') {
    if (tool.name === 'book_hotel') {
      const b = tool.result.booking;
      return (
        <div className="mt-3 rounded-2xl bg-[#0F172A] border border-blue-500/40 overflow-hidden shadow-xl space-y-3">
          <div className="relative h-32 w-full">
            <img src={b.image_url} alt={b.hotel_name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-400/50 text-[10px] font-bold text-blue-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Confirmed Stay</span>
            </div>
            <div className="absolute bottom-2 left-3">
              <h4 className="font-bold text-sm text-white">{b.hotel_name}</h4>
              <p className="text-[10px] text-gray-300">{b.destination}</p>
            </div>
          </div>

          <div className="px-3.5 pb-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-gray-300 text-[11px]">
              <span>Stay: <strong>{b.check_in_date} → {b.check_out_date}</strong></span>
              <span>Total: <strong>${Number(b.total_price).toFixed(2)}</strong></span>
            </div>
            <div className="p-2 rounded-xl bg-black/50 border border-gray-800 flex items-center justify-between text-[11px] font-mono text-cyan-300">
              <span>Conf: {b.confirmation_code}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Synced to Calendar
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (tool.name === 'search_hotels') {
      const hotels = Array.isArray(tool.result) ? tool.result : [];
      if (hotels.length === 0) return null;
      const isNearest = hotels.some((h: any) => h.distanceMiles !== undefined);

      return (
        <div className="mt-3 space-y-2.5">
          <span className="font-bold text-blue-400 flex items-center gap-1.5 text-xs">
            <Hotel className="w-3.5 h-3.5" />
            {isNearest ? 'Nearest Luxury Accommodations to You' : 'World Luxury Hotel Accommodations'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {hotels.slice(0, 2).map((h: any) => (
              <div key={h.id} className="rounded-xl bg-[#0F172A] border border-blue-500/30 overflow-hidden shadow-lg flex flex-col justify-between">
                <div className="relative h-32 w-full">
                  <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  
                  {/* Rating Badge */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-blue-300">
                    ⭐ {h.userRating}/5 ({h.reviewsCount})
                  </div>

                  {/* Nearest / Distance Badge */}
                  {h.distanceMiles !== undefined && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-400/50 backdrop-blur-md text-[10px] font-bold text-blue-200 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{h.distanceMiles < 100 ? `${h.distanceMiles} mi away` : `${h.city}, ${h.country}`}</span>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-[9px] text-blue-300 font-semibold">{h.destination}</span>
                    <h5 className="font-bold text-xs text-white truncate">{h.name}</h5>
                  </div>
                </div>
                <div className="p-2.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-300">{h.starRating} Star Luxury</span>
                    <span className="font-bold text-cyan-300">${h.pricePerNight}<span className="text-[9px] text-gray-400">/night</span></span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-2">{h.description}</p>
                  <button
                    type="button"
                    onClick={() => onSendMessage && onSendMessage(`Book ${h.name}`)}
                    className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition-all"
                  >
                    Book Stay & Sync Calendar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // 6. 📅 CALENDAR EVENTS RETRIEVAL CARD
  if (tool.name === 'get_calendar_events') {
    const events = Array.isArray(tool.result) ? tool.result.slice(0, 3) : [];
    if (events.length === 0) return null;
    return (
      <div className="mt-3 p-3.5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-2.5 text-xs">
        <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-[11px]">
          <Calendar className="w-3.5 h-3.5" />
          Synchronized Alexa+ Calendar Schedule
        </span>
        <div className="space-y-1.5">
          {events.map((e: any, idx: number) => (
            <div key={idx} className="p-2 rounded-xl bg-[#0B0F19] border border-gray-800 flex items-center justify-between">
              <div>
                <h5 className="font-bold text-white text-[11px]">{e.title}</h5>
                <p className="text-[10px] text-gray-400">{new Date(e.start_time).toLocaleDateString()} • {e.location || 'Confirmed'}</p>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-semibold">
                Calendar Event
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
