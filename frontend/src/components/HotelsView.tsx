import React, { useState, useEffect } from 'react';
import {
  Hotel,
  Calendar,
  MapPin,
  Star,
  CheckCircle2,
  Search,
  X,
} from 'lucide-react';
import { api, HotelListing, HotelBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export const HotelsView: React.FC = () => {
  const { token } = useAuth();
  const { speak } = useSpeechSynthesis();
  const [hotels, setHotels] = useState<HotelListing[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [searchDestination, setSearchDestination] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('All');

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

  const destinations = ['All', 'Santorini', 'Paris', 'Tokyo', 'New York', 'Goa'];

  const loadHotels = async () => {
    try {
      const [hRes, bRes] = await Promise.all([
        api.getHotels(),
        api.getUserHotelBookings(token),
      ]);
      setHotels(hRes.hotels);
      setBookings(bRes.bookings);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHotels();
  }, [token]);

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
      // Speak Alexa vocal confirmation out loud!
      if (result.vocalConfirmation) {
        speak(result.vocalConfirmation);
      }
      await loadHotels();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHotels = hotels.filter(h => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchDestination.toLowerCase()) ||
      h.destination.toLowerCase().includes(searchDestination.toLowerCase()) ||
      h.city.toLowerCase().includes(searchDestination.toLowerCase());
    const matchesDest =
      selectedDestination === 'All' || h.destination.includes(selectedDestination);
    return matchesSearch && matchesDest;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#111827] via-[#16273B] to-[#111827] border border-blue-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
              <Hotel className="w-4 h-4 text-blue-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Alexa<span className="text-blue-400">+</span> Luxury Hotel & Travel Concierge
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Search luxury suites, view resort photography, receive Alexa vocal booking confirmations, and automatically sync your stays into Calendar.
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-[#0B0F19]/80 border border-blue-500/40 px-4 py-2 rounded-2xl shrink-0">
          <Calendar className="w-4 h-4 text-blue-400" />
          <div className="text-left text-xs">
            <span className="font-bold text-blue-300 block">Real-time Calendar Sync</span>
            <span className="text-[10px] text-gray-400">Automatic check-in/out scheduling</span>
          </div>
        </div>
      </div>

      {/* Destination Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#111827] p-3 rounded-2xl border border-gray-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchDestination}
            onChange={e => setSearchDestination(e.target.value)}
            placeholder="Search destination, country, resort name..."
            className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {destinations.map(dest => (
            <button
              key={dest}
              type="button"
              onClick={() => setSelectedDestination(dest)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedDestination === dest
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 border border-transparent'
              }`}
            >
              {dest}
            </button>
          ))}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-amber-300 flex items-center gap-1 shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{hotel.userRating}</span>
                  <span className="text-gray-400 text-[10px]">({hotel.reviewsCount})</span>
                </div>

                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-blue-950/80 backdrop-blur-md border border-blue-500/40 text-[11px] font-bold text-blue-300">
                  ${hotel.pricePerNight} <span className="text-[9px] text-gray-300 font-normal">/ night</span>
                </div>

                <div className="absolute bottom-3 left-3 text-xs font-bold text-white flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{hotel.destination}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-base text-white group-hover:text-blue-300 transition-colors">
                  {hotel.name}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {hotel.description}
                </p>

                {/* Amenities Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-gray-800/80 border border-gray-700 text-[10px] text-gray-300"
                    >
                      {amenity}
                    </span>
                  ))}
                  {hotel.amenities.length > 3 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-blue-400 font-mono">
                      +{hotel.amenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Book Now Button */}
            <div className="px-5 pb-5 pt-1">
              <button
                type="button"
                onClick={() => handleOpenBooking(hotel)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Hotel & Add to Calendar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booked Stays & Calendar Sync List */}
      {bookings.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-800">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Your Confirmed Hotel Stays in Calendar ({bookings.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((booking, idx) => (
              <div
                key={idx}
                className="bg-[#111827] border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-gray-700">
                    <img
                      src={booking.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'}
                      alt={booking.hotel_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs text-white truncate">{booking.hotel_name}</h4>
                    <p className="text-[11px] text-gray-400">
                      {booking.check_in_date} → {booking.check_out_date} ({booking.guests} Guests)
                    </p>
                    <p className="text-[10px] text-blue-400 font-mono">
                      Conf: {booking.confirmation_code} • {booking.room_type}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-500/40 text-[10px] text-blue-300 font-semibold block">
                    Synced to Calendar
                  </span>
                  <span className="text-[11px] font-bold text-white mt-1 block">
                    ${Number(booking.total_price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {activeHotel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-blue-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => setActiveHotel(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {bookingResult ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Hotel Stay Confirmed!</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {bookingResult.vocalConfirmation}
                </p>
                <div className="p-3 rounded-2xl bg-[#0B0F19] border border-emerald-500/30 text-xs text-emerald-300 font-mono">
                  Confirmation Code: {bookingResult.booking.confirmation_code}
                </div>
                <p className="text-[11px] text-cyan-300 flex items-center justify-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Added to your Alexa+ Calendar with check-in alerts!</span>
                </p>
                <button
                  type="button"
                  onClick={() => setActiveHotel(null)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xs"
                >
                  Close & View Calendar
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Hotel className="w-4 h-4 text-blue-400" />
                    <span>Book {activeHotel.name}</span>
                  </h3>
                  <p className="text-xs text-gray-400">{activeHotel.destination} • {activeHotel.starRating} Stars</p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">Check-in Date</label>
                    <input
                      type="date"
                      required
                      value={checkIn}
                      onChange={e => setCheckIn(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Check-out Date</label>
                    <input
                      type="date"
                      required
                      value={checkOut}
                      onChange={e => setCheckOut(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                    />
                  </div>
                </div>

                {/* Guests & Room Choice */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">Guests</label>
                    <select
                      value={guests}
                      onChange={e => setGuests(Number(e.target.value))}
                      className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                    >
                      {[1, 2, 3, 4, 6].map(n => (
                        <option key={n} value={n}>{n} Guests</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Room Selection</label>
                    <select
                      value={selectedRoom}
                      onChange={e => setSelectedRoom(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                    >
                      {activeHotel.roomTypes.map(r => (
                        <option key={r.type} value={r.type}>
                          {r.type} (${r.price}/nt)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0B0F19] border border-gray-800 text-xs text-gray-300 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Nightly Rate:</span>
                    <span className="text-blue-300 font-mono">${activeHotel.pricePerNight}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-[11px]">
                    <span>Amenities Included:</span>
                    <span>{activeHotel.amenities.slice(0, 2).join(', ')}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Confirming with Hotel...' : 'Confirm Reservation & Add to Calendar'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
