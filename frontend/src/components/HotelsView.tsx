import React, { useState, useEffect } from 'react';
import {
  Hotel,
  Calendar,
  MapPin,
  Star,
  CheckCircle2,
  Search,
  X,
  Mic,
  MicOff,
  Globe,
  Compass,
  Navigation,
  Loader2,
} from 'lucide-react';
import { api, HotelListing, HotelBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export const HotelsView: React.FC = () => {
  const { token } = useAuth();
  const { speak } = useSpeechSynthesis();
  const [hotels, setHotels] = useState<HotelListing[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [searchDestination, setSearchDestination] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('All');
  const [selectedDestination, setSelectedDestination] = useState('All');
  const [isNearestActive, setIsNearestActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat?: number; lng?: number } | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<{ city?: string; country?: string; currency?: string; symbol?: string } | null>(null);

  // Auto-detect user's real-world location and country currency via IP & Geolocation
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        if (d && d.city && d.country_name) {
          const sym = d.currency === 'INR' ? '₹' : d.currency === 'EUR' ? '€' : d.currency === 'GBP' ? '£' : d.currency === 'JPY' ? '¥' : '$';
          setDetectedLocation({
            city: d.city,
            country: d.country_name,
            currency: d.currency || 'USD',
            symbol: sym,
          });
          setUserCoords({ lat: d.latitude, lng: d.longitude });
        }
      })
      .catch(() => {
        // Fallback default
        setDetectedLocation({
          city: 'Mumbai',
          country: 'India',
          currency: 'INR',
          symbol: '₹',
        });
      });
  }, []);

  // Booking Modal State
  const [activeHotel, setActiveHotel] = useState<HotelListing | null>(null);
  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 19);
    return d.toISOString().split('T')[0];
  });
  const [guests, setGuests] = useState(2);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any | null>(null);

  const continents = ['All', 'Europe', 'Asia', 'Americas', 'Africa', 'Oceania'];

  const quickCities = [
    'All',
    'Mumbai',
    'New Delhi',
    'Bengaluru',
    'Goa',
    'Jaipur',
    'Udaipur',
    'Paris',
    'London',
    'Santorini',
    'Zermatt',
    'Tokyo',
    'Dubai',
    'Singapore',
    'New York',
    'Los Angeles',
    'Sydney',
  ];

  const loadHotels = async (isNearest = false, coords?: { lat: number; lng: number }) => {
    setIsLoading(true);
    try {
      if (isNearest) {
        const hRes = await api.getHotels(undefined, undefined, undefined, undefined, true, coords?.lat, coords?.lng);
        setHotels(hRes.hotels);
      } else {
        const [hRes, bRes] = await Promise.all([
          api.getHotels(),
          api.getUserHotelBookings(token),
        ]);
        setHotels(hRes.hotels);
        setBookings(bRes.bookings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, [token]);

  // Handle voice query on Hotels page
  const handleVoiceHotelQuery = async (spokenText: string) => {
    if (!spokenText.trim()) return;
    const lower = spokenText.toLowerCase();

    if (lower.includes('nearest') || lower.includes('near me') || lower.includes('in my place') || lower.includes('my place') || lower.includes('nearby')) {
      handleToggleNearest(true);
    } else {
      setIsNearestActive(false);
      const cleanDest = spokenText
        .replace(/^alexa[, ]*/i, '')
        .replace(/hotels in|hotel in|show hotels in|hotels near|find hotels in|hotels/gi, '')
        .replace(/with images|with image|images|image|please/gi, '')
        .trim();

      setSearchDestination(cleanDest || spokenText.trim());
      setIsLoading(true);
      try {
        const res = await api.getHotels(cleanDest || spokenText.trim());
        setHotels(res.hotels);
        if (res.hotels.length > 0) {
          speak(`Found ${res.hotels.length} luxury hotels in ${res.hotels[0].destination}. Top pick is ${res.hotels[0].name}.`);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const { isListening, toggleListening } = useSpeechRecognition(handleVoiceHotelQuery);

  const handleToggleNearest = (forceState?: boolean) => {
    const nextState = forceState !== undefined ? forceState : !isNearestActive;
    setIsNearestActive(nextState);

    if (nextState) {
      setSelectedContinent('All');
      setSelectedDestination('All');
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserCoords(coords);
            loadHotels(true, coords);
            speak('Showing nearest luxury hotel accommodations to your location with images and distances.');
          },
          () => {
            loadHotels(true);
            speak('Showing nearest hotels to your area with photography and room rates.');
          },
          { timeout: 6000 }
        );
      } else {
        loadHotels(true);
        speak('Showing nearest hotels to your area with photography and room rates.');
      }
    } else {
      loadHotels(false);
    }
  };

  const handleOpenBooking = (hotel: HotelListing) => {
    setActiveHotel(hotel);
    setSelectedRoom(hotel.roomTypes[0].type);
    setBookingResult(null);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHotel) return;
    setIsSubmitting(true);

    try {
      const result = await api.bookHotel(
        {
          hotel_name: activeHotel.name,
          destination: activeHotel.destination,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          room_type: selectedRoom,
        },
        token
      );

      setBookingResult(result);
      if (result.vocalConfirmation) {
        speak(result.vocalConfirmation);
      }
      await loadHotels(isNearestActive, userCoords ? { lat: userCoords.lat!, lng: userCoords.lng! } : undefined);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHotels = hotels.filter(h => {
    const matchesSearch =
      !searchDestination ||
      h.name.toLowerCase().includes(searchDestination.toLowerCase()) ||
      h.destination.toLowerCase().includes(searchDestination.toLowerCase()) ||
      h.city.toLowerCase().includes(searchDestination.toLowerCase()) ||
      h.country.toLowerCase().includes(searchDestination.toLowerCase());

    const matchesContinent =
      selectedContinent === 'All' ||
      h.continent?.toLowerCase() === selectedContinent.toLowerCase();

    const matchesDest =
      selectedDestination === 'All' ||
      h.destination.toLowerCase().includes(selectedDestination.toLowerCase()) ||
      h.city.toLowerCase().includes(selectedDestination.toLowerCase());

    return matchesSearch && matchesContinent && matchesDest;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#111827] via-[#16273B] to-[#111827] border border-blue-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
              <Hotel className="w-4 h-4 text-blue-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Alexa<span className="text-blue-400">+</span> World Hotels & Travel Concierge
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Explore premier resorts worldwide or locate nearest luxury hotels in your place with photography, ratings, vocal confirmations, and automatic calendar sync.
          </p>
        </div>

        {/* Proximity / Nearest Toggle Button & Confirmed Bookings Count */}
        <div className="flex items-center gap-2 shrink-0">
          {bookings.length > 0 && (
            <div className="px-3 py-2 rounded-2xl bg-[#0B0F19]/80 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{bookings.length} Booked</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => handleToggleNearest()}
            className={`px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold shadow-lg ${
              isNearestActive
                ? 'bg-blue-600 text-white border-blue-400 shadow-blue-500/30 ring-2 ring-blue-400/50'
                : 'bg-[#0B0F19]/90 text-blue-300 border-blue-500/40 hover:bg-blue-950/60'
            }`}
          >
            <Navigation className={`w-4 h-4 ${isNearestActive ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>{isNearestActive ? 'Showing Nearest to Me' : '📍 Nearest in My Place'}</span>
          </button>
        </div>
      </div>

      {/* Detected Location & Country Currency Indicator */}
      {detectedLocation && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 shadow-md">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Detected Location:</strong> {detectedLocation.city}, {detectedLocation.country}
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-cyan-300">
            <span>Local Pricing: <strong>{detectedLocation.currency} ({detectedLocation.symbol})</strong></span>
            <span className="text-gray-500">•</span>
            <span className="text-emerald-400">GPS & IP Synced</span>
          </div>
        </div>
      )}

      {/* Search Bar & Voice Search Control */}
      <div className="bg-[#111827] p-4 rounded-3xl border border-gray-800 space-y-3 shadow-xl">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchDestination}
              onChange={e => setSearchDestination(e.target.value)}
              placeholder="Search world hotels, cities (Paris, Mumbai, Tokyo, London, Zermatt, New York)..."
              className="w-full bg-[#0B0F19] border border-gray-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-400 transition-colors"
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin absolute right-3.5 top-3" />
            )}
          </div>

          {/* Voice Search Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
            }`}
            title="Ask by voice: 'Nearest hotels in my place' or 'Hotels in Paris'"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Search'}</span>
          </button>
        </div>

        {/* Continents & Quick City Filters */}
        <div className="space-y-2 pt-2 border-t border-gray-800/60">
          {/* Continent Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-400 font-semibold text-[11px] flex items-center gap-1 shrink-0">
              <Globe className="w-3.5 h-3.5 text-blue-400" /> Continents:
            </span>
            {continents.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setSelectedContinent(c);
                  setIsNearestActive(false);
                }}
                className={`px-3 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
                  selectedContinent === c && !isNearestActive
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'bg-gray-800/60 text-gray-400 hover:text-gray-200'
                }`}
              >
                {c === 'All' ? 'All World' : c}
              </button>
            ))}
          </div>

          {/* City Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-400 font-semibold text-[11px] flex items-center gap-1 shrink-0">
              <Compass className="w-3.5 h-3.5 text-blue-400" /> Cities:
            </span>
            {quickCities.map(city => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setSelectedDestination(city);
                  setIsNearestActive(false);
                }}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                  selectedDestination === city && !isNearestActive
                    ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50 shadow-sm'
                    : 'bg-gray-800/40 text-gray-400 hover:text-gray-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hotels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHotels.map(hotel => (
          <div
            key={hotel.id}
            className="group bg-[#111827] border border-gray-800 hover:border-blue-500/40 rounded-3xl overflow-hidden shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              {/* Hotel Imagery Header */}
              <div className="relative h-52 w-full overflow-hidden">
                <img
                  src={hotel.imageUrl}
                  alt={hotel.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-amber-300 flex items-center gap-1 shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{hotel.userRating}</span>
                  <span className="text-gray-400 text-[10px]">({hotel.reviewsCount})</span>
                </div>

                {/* Country & Currency Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-blue-950/90 backdrop-blur-md border border-blue-400/60 text-[10px] font-bold text-blue-200 flex items-center gap-1 shadow-lg">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>{hotel.country} • {hotel.currencyCode || 'USD'}</span>
                </div>

                {/* Destination & Local Price Banner */}
                <div className="absolute bottom-3 left-3 right-3 text-xs font-bold text-white flex items-center justify-between">
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{hotel.destination}</span>
                  </div>
                  <span className="text-cyan-300 font-bold shrink-0 bg-black/60 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                    {hotel.formattedPrice || `${hotel.currencySymbol || '$'}${hotel.pricePerNight.toLocaleString()}`}/night
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
                      {hotel.starRating} Star Luxury • {hotel.city}
                    </span>
                    {hotel.distanceMiles !== undefined && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {hotel.distanceMiles < 100 ? `${hotel.distanceMiles} mi away` : 'Nearby'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                    {hotel.name}
                  </h3>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {hotel.description}
                </p>

                {/* Local Price Pill */}
                <div className="p-2 rounded-xl bg-[#0B0F19] border border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-gray-400 text-[11px]">Nightly Rate ({hotel.currencyCode || 'USD'}):</span>
                  <span className="text-cyan-300 font-bold font-mono">
                    {hotel.formattedPrice || `${hotel.currencySymbol || '$'}${hotel.pricePerNight.toLocaleString()}`}
                  </span>
                </div>

                {/* Amenities Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hotel.amenities.slice(0, 3).map((amenity, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-gray-800/70 border border-gray-700/50 text-[10px] text-gray-300"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Book Now Button */}
            <div className="px-5 pb-5 pt-1">
              <button
                type="button"
                onClick={() => handleOpenBooking(hotel)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reserve Stay & Sync Calendar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {activeHotel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-blue-500/40 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveHotel(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-blue-400">Alexa+ Verified Booking</span>
              <h2 className="text-xl font-bold text-white">{activeHotel.name}</h2>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-400" /> {activeHotel.locationDetails}, {activeHotel.destination}
              </p>
            </div>

            {bookingResult ? (
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Reservation Confirmed & Synced to Calendar!</span>
                </div>
                <p className="text-gray-300">{bookingResult.vocalConfirmation}</p>
                <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-gray-800 flex justify-between font-mono text-[11px] text-cyan-300">
                  <span>Confirmation: {bookingResult.booking?.confirmation_code}</span>
                  <span>Total: {activeHotel.currencySymbol || '$'}{bookingResult.booking?.total_price?.toLocaleString()} ({activeHotel.currencyCode || 'USD'})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveHotel(null)}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-center mt-2"
                >
                  Close & View Calendar
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-gray-400 font-medium text-[11px]">Check-in Date</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={e => setCheckIn(e.target.value)}
                      required
                      className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 font-medium text-[11px]">Check-out Date</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={e => setCheckOut(e.target.value)}
                      required
                      className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-gray-400 font-medium text-[11px]">Number of Guests</label>
                    <select
                      value={guests}
                      onChange={e => setGuests(Number(e.target.value))}
                      className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-400 outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6].map(g => (
                        <option key={g} value={g}>
                          {g} Guest{g > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 font-medium text-[11px]">Select Room Type</label>
                    <select
                      value={selectedRoom}
                      onChange={e => setSelectedRoom(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-400 outline-none"
                    >
                      {activeHotel.roomTypes.map(r => (
                        <option key={r.type} value={r.type}>
                          {r.type} ({r.formattedPrice || `${activeHotel.currencySymbol || '$'}${r.price.toLocaleString()}`}/night)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition-all text-xs flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming with Concierge...</span>
                    </>
                  ) : (
                    <span>Confirm Reservation & Sync Calendar</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
