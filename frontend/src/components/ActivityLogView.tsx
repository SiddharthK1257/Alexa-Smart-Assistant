import React, { useState, useEffect } from 'react';
import { History, Shield, RefreshCw, AlertCircle, Wrench, CheckCircle, XCircle } from 'lucide-react';
import { api, AuditEventItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ActivityLogView: React.FC = () => {
  const { user, token, quickDemoLogin } = useAuth();
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');

  const loadAuditEvents = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAuditEvents(token);
      setEvents(res.auditEvents || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      loadAuditEvents();
    } else {
      setEvents([]);
    }
  }, [user, token]);

  const filteredEvents = events.filter(ev => {
    if (statusFilter === 'all') return true;
    return ev.status === statusFilter;
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-[#111827] border border-cyan-500/30 text-cyan-400">
          <History className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-100">Sign in to view Activity Trail</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Every MCP tool invocation, task creation, and security check is cryptographically attributed to your user session.
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
            <History className="w-6 h-6 text-cyan-400" />
            <span>Activity & Tool Execution Trail</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              {events.length} events
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time security auditing and MCP tool execution logs from Supabase PostgreSQL
          </p>
        </div>

        <button
          onClick={loadAuditEvents}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F2937] hover:bg-cyan-500/10 border border-gray-700 text-cyan-300 text-xs font-medium transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-2 bg-[#111827] border border-gray-800 rounded-xl p-3 text-xs">
        <span className="text-gray-400 font-medium">Status Filter:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setStatusFilter('success')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Success Only
          </button>
          <button
            onClick={() => setStatusFilter('failure')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === 'failure'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Failures Only
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Events List */}
      {filteredEvents.length === 0 && !isLoading ? (
        <div className="bg-[#111827] border border-gray-800/80 rounded-2xl p-12 text-center space-y-3">
          <Shield className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-semibold text-gray-300">No activity recorded yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Interact with the assistant, create tasks, or execute tools to generate audit trails.
          </p>
        </div>
      ) : (
        <div className="space-y-3 font-mono text-xs">
          {filteredEvents.map(ev => {
            const isSuccess = ev.status === 'success';
            return (
              <div
                key={ev.id}
                className="bg-[#111827] border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-gray-700 transition-all shadow-md"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-gray-100">{ev.event_type}</span>
                    {ev.tool_name && (
                      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-800/40 text-cyan-300">
                        <Wrench className="w-3 h-3" />
                        <span>{ev.tool_name}</span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider font-semibold ${
                        isSuccess
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {isSuccess ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{ev.status}</span>
                    </span>
                  </div>

                  {ev.details && Object.keys(ev.details).length > 0 && (
                    <pre className="bg-[#0B0F19] border border-gray-800/80 rounded-lg p-2.5 text-[11px] text-gray-300 overflow-x-auto max-h-40">
                      {JSON.stringify(ev.details, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="shrink-0 text-right text-[11px] text-gray-500">
                  <div>{new Date(ev.created_at).toLocaleDateString()}</div>
                  <div className="text-gray-400 font-bold">
                    {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
