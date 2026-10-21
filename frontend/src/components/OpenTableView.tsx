import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Calendar,
  Star,
  MapPin,
  CheckCircle2,
  Lock,
  Link2,
  AlertCircle,
  X,
  Search,
} from 'lucide-react';
import { api, OpenTableAccount, RestaurantItem, RestaurantReservation } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const OpenTableView: React.FC = () => {
  const { user, token } = useAuth();
  const [account, setAccount] = useState<OpenTableAccount | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [reservations, setReservations] = useState<RestaurantReservation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  // Booking Modal State
  const [bookingRestaurant, setBookingRestaurant] = useState<RestaurantItem | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [bookingTime, setBookingTime] = useState('19:30');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Link Account Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPhone, setLinkPhone] = useState('+1 (555) 234-5678');
  const [linkName, setLinkName] = useState('');
  const [accountError, setAccountError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [accRes, restRes, resvRes] = await Promise.all([
        api.getOpenTableAccount(token),
        api.getRestaurants(),
        api.getUserReservations(token),
      ]);
      setIsLinked(accRes.isLinked);
      setAccount(accRes.account);
      setRestaurants(restRes.restaurants);
      setReservations(resvRes.reservations);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    if (user?.email) {
      setLinkEmail(user.email);
      setLinkName(user.email.split('@')[0]);
    }
  }, [token, user]);

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);
    try {
      const res = await api.linkOpenTableAccount(
        { email: linkEmail, phone: linkPhone, full_name: linkName },
        token
      );
      setAccount(res.account);
      setIsLinked(true);
      setIsLinkModalOpen(false);
    } catch (err: any) {
      setAccountError(err.message || 'Failed to connect OpenTable');
    }
  };

  const handleOpenBooking = (rest: RestaurantItem) => {
    if (!isLinked) {
      setIsLinkModalOpen(true);
      return;
    }
    setBookingRestaurant(rest);
    setBookingSuccess(null);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingRestaurant) return;
    setIsSubmitting(true);
    setAccountError(null);

    try {
      const result = await api.bookRestaurant(
        {
          restaurant_name: bookingRestaurant.name,
          party_size: partySize,
          date: bookingDate,
          time: bookingTime,
          special_requests: specialRequests,
        },
        token
      );
      setBookingSuccess(result);
      await loadData();
    } catch (err: any) {
      if (err.requiresOpenTable) {
        setIsLinkModalOpen(true);
      } else {
        setAccountError(err.message || 'Booking failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const cuisines = ['All', 'Contemporary Italian', 'Modern Japanese', 'French Brasserie', 'Modern Spanish', 'Farm-to-Table'];

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = selectedCuisine === 'All' || r.cuisine.includes(selectedCuisine);
    return matchesSearch && matchesCuisine;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#111827] via-[#2A1B24] to-[#111827] border border-red-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-red-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Alexa<span className="text-red-400">+</span> OpenTable Dining Reservations
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Official OpenTable dining integration. Book tables with voice, view restaurant photography, and automatically sync reservations to your Calendar.
          </p>
        </div>

        {/* OpenTable Account Status Pill */}
        <div className="flex items-center gap-3 bg-[#0B0F19]/80 border border-gray-700/60 px-4 py-2 rounded-2xl shrink-0">
          {isLinked ? (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="font-bold text-gray-200 block">OpenTable Connected</span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {account?.email} • {account?.dining_points || 1250} pts
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Connect OpenTable Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice if not linked */}
      {!isLinked && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">OpenTable Account Required to Complete Bookings</p>
              <p className="text-gray-300 text-[11px] mt-0.5">
                You can browse restaurants and available time slots freely. To complete table reservations via Alexa+ voice or one-click booking, connect your OpenTable account below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shrink-0"
          >
            Connect Now
          </button>
        </div>
      )}

      {/* Search & Cuisine Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#111827] p-3 rounded-2xl border border-gray-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search restaurants, cuisines, waterfront..."
            className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-red-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {cuisines.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCuisine(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCuisine === c
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                  : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 border border-transparent'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant Grid with Rich Imagery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRestaurants.map(restaurant => (
          <div
            key={restaurant.id}
            className="group bg-[#111827] border border-gray-800 hover:border-red-500/40 rounded-3xl overflow-hidden shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              {/* Restaurant Image */}
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={restaurant.imageUrl}
                  alt={restaurant.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-amber-300 flex items-center gap-1 shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{restaurant.rating}</span>
                  <span className="text-gray-400 text-[10px]">({restaurant.reviewsCount})</span>
                </div>

                {/* Price Tier */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-gray-200">
                  {restaurant.priceRange}
                </div>

                {/* Cuisine Tag */}
                <div className="absolute bottom-3 left-3 text-xs font-semibold text-red-300">
                  {restaurant.cuisine}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-base text-white group-hover:text-red-300 transition-colors">
                  {restaurant.name}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {restaurant.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">{restaurant.location}</span>
                </div>

                {/* Available Slots */}
                <div className="space-y-1.5 pt-2 border-t border-gray-800">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                    Available Today:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {restaurant.availableTimes.slice(0, 4).map((time, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-lg bg-red-950/30 border border-red-500/30 text-[10px] font-mono text-red-300"
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="px-5 pb-5 pt-1">
              <button
                type="button"
                onClick={() => handleOpenBooking(restaurant)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reserve Table via OpenTable</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bookings & Calendar Sync Summary */}
      {reservations.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-800">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Your Confirmed Reservations & Calendar Events ({reservations.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reservations.map((resv, idx) => (
              <div
                key={idx}
                className="bg-[#111827] border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-700">
                    <img
                      src={resv.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'}
                      alt={resv.restaurant_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs text-white truncate">{resv.restaurant_name}</h4>
                    <p className="text-[11px] text-gray-400">
                      {resv.reservation_date} at {resv.reservation_time} • {resv.party_size} Guests
                    </p>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Conf: {resv.confirmation_code}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] text-emerald-300 font-semibold block">
                    Synced to Calendar
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingRestaurant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-red-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => setBookingRestaurant(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {bookingSuccess ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Table Confirmed!</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {bookingSuccess.vocalConfirmation}
                </p>
                <div className="p-3 rounded-2xl bg-[#0B0F19] border border-emerald-500/30 text-xs text-emerald-300 font-mono">
                  Confirmation Code: {bookingSuccess.reservation.confirmation_code}
                </div>
                <p className="text-[11px] text-cyan-300">
                  📅 Automatically synchronized with your Alexa+ Calendar schedule.
                </p>
                <button
                  type="button"
                  onClick={() => setBookingRestaurant(null)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold text-xs"
                >
                  Close & View Schedule
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-red-400" />
                    <span>Reserve at {bookingRestaurant.name}</span>
                  </h3>
                  <p className="text-xs text-gray-400">{bookingRestaurant.cuisine} • {bookingRestaurant.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">Party Size</label>
                    <select
                      value={partySize}
                      onChange={e => setPartySize(Number(e.target.value))}
                      className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                        <option key={n} value={n}>{n} Guests</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Reservation Date</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-xs">Preferred Time</label>
                  <div className="grid grid-cols-4 gap-2">
                    {bookingRestaurant.availableTimes.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBookingTime(t)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                          bookingTime === t
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-xs">Special Dietary or Seating Requests</label>
                  <input
                    type="text"
                    value={specialRequests}
                    onChange={e => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Window booth, quiet table, celebrating anniversary"
                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-100 placeholder-gray-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Confirming with OpenTable...' : 'Confirm Table & Sync to Calendar'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Link OpenTable Account Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-red-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center mx-auto text-red-400">
                <Link2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Connect OpenTable Account</h3>
              <p className="text-xs text-gray-400">
                Link your OpenTable dining profile to authorize Alexa+ to reserve tables seamlessly.
              </p>
            </div>

            {accountError && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>{accountError}</span>
              </div>
            )}

            <form onSubmit={handleLinkAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">OpenTable Account Email</label>
                <input
                  type="email"
                  required
                  value={linkEmail}
                  onChange={e => setLinkEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Contact Phone (for SMS notifications)</label>
                <input
                  type="text"
                  required
                  value={linkPhone}
                  onChange={e => setLinkPhone(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Diner Full Name</label>
                <input
                  type="text"
                  required
                  value={linkName}
                  onChange={e => setLinkName(e.target.value)}
                  placeholder="e.g. Alexa Verified Diner"
                  className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 mt-2"
              >
                Connect OpenTable & Enable Dining
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
