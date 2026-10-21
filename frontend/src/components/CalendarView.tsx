import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Hotel,
  UtensilsCrossed,
  Bell,
  Clock,
  MapPin,
  CheckCircle2,
  Plus,
  X,
  Filter,
} from 'lucide-react';
import { api, CalendarEvent } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CalendarView: React.FC = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'hotel' | 'restaurant' | 'reminder' | 'personal'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'hotel' | 'restaurant' | 'reminder' | 'personal'>('personal');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const loadEvents = async () => {
    try {
      const res = await api.getCalendarEvents(token);
      setEvents(res.events);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [token]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addCalendarEvent(
        {
          title: newEventTitle,
          event_type: newEventType,
          start_time: newStartDate,
          end_time: newEndDate,
          location: newLocation,
          description: newDescription,
        },
        token
      );
      setIsAddModalOpen(false);
      setNewEventTitle('');
      setNewLocation('');
      setNewDescription('');
      await loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEvents = events.filter(e => filterType === 'all' || e.event_type === filterType);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'hotel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
            <Hotel className="w-3 h-3" />
            <span>Hotel Stay</span>
          </span>
        );
      case 'restaurant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold">
            <UtensilsCrossed className="w-3 h-3" />
            <span>OpenTable Dining</span>
          </span>
        );
      case 'reminder':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
            <Bell className="w-3 h-3" />
            <span>Reminder</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
            <CalendarIcon className="w-3 h-3" />
            <span>Schedule</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#111827] border border-cyan-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Alexa<span className="text-cyan-400">+</span> Unified Calendar & Reservations Schedule
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            All your booked hotel stays, OpenTable restaurant tables, and scheduled reminders in one synchronized timeline.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs transition-all shadow-md active:scale-95 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Event</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-[#111827] p-3 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1 sm:pb-0">
          <span className="text-gray-400 flex items-center gap-1 font-semibold uppercase text-[10px] mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          {[
            { id: 'all', label: `All Events (${events.length})` },
            { id: 'hotel', label: `Hotels (${events.filter(e => e.event_type === 'hotel').length})` },
            { id: 'restaurant', label: `Dining (${events.filter(e => e.event_type === 'restaurant').length})` },
            { id: 'reminder', label: `Reminders (${events.filter(e => e.event_type === 'reminder').length})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-cyan-400 font-mono hidden sm:inline-block">
          Auto-synchronized with Voice
        </span>
      </div>

      {/* Events Timeline Feed */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-[#111827] border border-gray-800 rounded-3xl space-y-3">
          <CalendarIcon className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-gray-300">No Events Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Tell Alexa: <em>"Alexa, book a hotel in Paris"</em> or <em>"Alexa, book a table on OpenTable"</em> and your reservations will automatically appear here!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event, idx) => (
            <div
              key={event.id || idx}
              className="bg-[#111827] border border-gray-800 hover:border-cyan-500/30 rounded-3xl p-5 shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                {/* Event Image or Icon Box */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-gray-700 relative">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#0B0F19] flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getEventBadge(event.event_type)}
                    <h3 className="font-bold text-sm text-white">{event.title}</h3>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
                    {event.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                    <span className="flex items-center gap-1.5 text-cyan-300 font-mono">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {new Date(event.start_time).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' → '}
                      {new Date(event.end_time).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {event.location && (
                      <span className="flex items-center gap-1 text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div className="shrink-0 flex items-center md:flex-col items-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-800">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmed</span>
                </span>
                {event.reference_id && (
                  <span className="text-[10px] text-gray-500 font-mono">
                    Ref: {event.reference_id}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-cyan-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-cyan-400" />
                <span>Add Event to Calendar</span>
              </h3>
              <p className="text-xs text-gray-400">
                Create a personal event or custom reservation on your schedule.
              </p>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Flight to Paris or Coffee with Alex"
                  className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Event Category</label>
                <select
                  value={newEventType}
                  onChange={e => setNewEventType(e.target.value as any)}
                  className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                >
                  <option value="personal">Personal Itinerary</option>
                  <option value="hotel">Hotel Stay</option>
                  <option value="restaurant">Dining Out</option>
                  <option value="reminder">Scheduled Alert</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEndDate}
                    onChange={e => setNewEndDate(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Location (Optional)</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="e.g. 15 Place Vendôme, Paris"
                  className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Reservation codes or travel notes"
                  className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-3 py-2 text-gray-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs shadow-md transition-all active:scale-95 mt-2"
              >
                Save Event to Calendar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
