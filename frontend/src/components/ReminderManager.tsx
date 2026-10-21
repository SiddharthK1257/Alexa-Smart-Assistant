import React, { useState, useEffect } from 'react';
import { Bell, Plus, Clock, Trash2, AlertCircle, Check } from 'lucide-react';
import { api, ReminderItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ReminderManager: React.FC = () => {
  const { user, token, quickDemoLogin } = useAuth();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New reminder form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReminders = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getReminders(token);
      setReminders(data.reminders);
    } catch (err: any) {
      setError(err.message || 'Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && token) {
      loadReminders();
    } else {
      setReminders([]);
    }
  }, [user?.id, token]);

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !scheduledTime || !token) return;
    setIsSubmitting(true);
    try {
      const res = await api.createReminder(
        {
          message: message.trim(),
          scheduled_time: new Date(scheduledTime).toISOString(),
        },
        token
      );
      setReminders(prev => [res.reminder, ...prev]);
      setShowAddModal(false);
      setMessage('');
      setScheduledTime('');
    } catch (err: any) {
      alert(`Error creating reminder: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissReminder = async (reminder: ReminderItem) => {
    if (!token) return;
    try {
      await api.updateReminder(reminder.id, { status: 'dismissed' }, token);
      setReminders(prev =>
        prev.map(r => (r.id === reminder.id ? { ...r, status: 'dismissed' } : r))
      );
    } catch (err: any) {
      alert(`Failed to update reminder: ${err.message}`);
    }
  };

  const handleDeleteReminder = async (reminderId: string, msg: string) => {
    if (!confirm(`Delete reminder "${msg}"?`)) return;
    if (!token) return;
    const original = [...reminders];
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    try {
      await api.deleteReminder(reminderId, token);
    } catch (err: any) {
      setReminders(original);
      alert(`Failed to delete: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-[#111827] border border-cyan-500/30 text-cyan-400">
          <Bell className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-100">Sign in to manage Reminders</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Schedule time-based alerts securely managed via Supabase and accessible directly from Alexa+.
        </p>
        <button
          onClick={() => quickDemoLogin()}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-sm hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg active:scale-95"
        >
          ⚡ Instant Demo Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <span>Reminders</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              {reminders.length} total
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Time-based notifications synchronized with the MCP toolset
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Reminders List */}
      {reminders.length === 0 && !isLoading ? (
        <div className="bg-[#111827] border border-gray-800/80 rounded-2xl p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-semibold text-gray-300">No scheduled reminders</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Say: "Alexa, remind me to drink water in two hours" or click New Reminder.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reminders.map(rem => {
            const date = new Date(rem.scheduled_time);
            const isDismissed = rem.status === 'dismissed';

            return (
              <div
                key={rem.id}
                className={`bg-[#111827] border rounded-xl p-4 flex flex-col justify-between gap-3 transition-all ${
                  isDismissed
                    ? 'border-gray-800/60 opacity-60'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <Bell className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <p className={`text-sm font-medium ${isDismissed ? 'line-through text-gray-400' : 'text-gray-100'}`}>
                        {rem.message}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {date.toLocaleDateString()} at{' '}
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteReminder(rem.id, rem.message)}
                    className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-full capitalize ${
                      rem.status === 'scheduled'
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        : rem.status === 'fired'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-gray-500/10 text-gray-400'
                    }`}
                  >
                    {rem.status}
                  </span>

                  {rem.status === 'scheduled' && (
                    <button
                      onClick={() => handleDismissReminder(rem)}
                      className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-100">Create Reminder</h2>
            <form onSubmit={handleCreateReminder} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-medium">Message *</label>
                <input
                  type="text"
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="e.g. Call dentist to confirm appointment"
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-gray-100 outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-gray-100 outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim() || !scheduledTime}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  {isSubmitting ? 'Scheduling...' : 'Set Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
