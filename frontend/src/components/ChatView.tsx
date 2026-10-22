import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Wrench,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  X,
  Radio,
  StopCircle,
} from 'lucide-react';
import { api, BACKEND_URL, ChatMessage, ToolExecution } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { AlexaRing, VoiceAssistantState } from './AlexaRing';
import { AssistantActionCard } from './AssistantActionCard';

interface MessageItem extends ChatMessage {
  id: string;
  timestamp: string;
  toolExecutions?: ToolExecution[];
  isError?: boolean;
}

interface ChatViewProps {
  currentConversationId?: string | null;
  onConversationCreated?: (id: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentConversationId,
  onConversationCreated,
}) => {
  const { user, token, quickDemoLogin } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Hello! I am your Alexa+ Smart Assistant. You can ask me day-to-day life questions, play music, find kitchen recipes with allergen and safety ratings, connect smart devices, book restaurants on OpenTable, or book luxury hotels with automatic calendar sync. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [executingToolName, setExecutingToolName] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    'Play Blinding Lights on YouTube',
    'Show me Butter Chicken recipe with images',
    'Nearest hotels in my place',
    'Play Shape of You by Ed Sheeran',
    'Book a table for 2 on OpenTable',
    'Show my calendar schedule',
  ]);

  const [userCoords, setUserCoords] = useState<{ latitude?: number; longitude?: number; city?: string; country?: string } | null>(null);

  // Auto-detect location coordinates & city for nearest hotel and local recommendations
  useEffect(() => {
    // 1. Instant IP geolocation lookup for city, country, and coordinates
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        if (d && d.city) {
          setUserCoords(prev => ({
            latitude: prev?.latitude ?? d.latitude,
            longitude: prev?.longitude ?? d.longitude,
            city: d.city,
            country: d.country_name,
          }));
        }
      })
      .catch(() => {});

    // 2. High-precision browser GPS geolocation
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords(prev => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
        },
        () => {},
        { timeout: 6000, maximumAge: 120000 }
      );
    }
    // 3. Proactively warm up backend service if sleeping on Render
    fetch(`${BACKEND_URL}/health`).catch(() => {});
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak, isSpeaking, isMuted, toggleMute, stopSpeaking } = useSpeechSynthesis();

  // Load conversation messages if conversationId is selected
  useEffect(() => {
    if (!currentConversationId || !token) {
      if (!currentConversationId) {
        setMessages([
          {
            id: 'welcome-1',
            role: 'assistant',
            content:
              'Hello! I am your Alexa+ Smart Assistant. You can ask me day-to-day life questions, play music, find kitchen recipes with allergen and safety ratings, connect smart devices, book restaurants on OpenTable, or book luxury hotels with automatic calendar sync. How can I help you today?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
      return;
    }

    let isMounted = true;
    api
      .getConversation(currentConversationId, token)
      .then(res => {
        if (!isMounted) return;
        if (res.messages && res.messages.length > 0) {
          const loaded: MessageItem[] = res.messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            toolExecutions: m.tool_calls as ToolExecution[],
          }));
          setMessages(loaded);
        }
      })
      .catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [currentConversationId, token]);

  // Speech Recognition hook with single-submission guard
  const {
    isListening,
    isRequestingPermission,
    transcript,
    interimTranscript,
    toggleListening,
    cancelListening,
    stopListening,
    error: speechError,
    clearError,
  } = useSpeechRecognition(finalText => {
    if (finalText.trim()) {
      handleSendMessage(finalText.trim());
    }
  });

  // Sync interim transcript into input field if speaking
  useEffect(() => {
    if (isListening && (transcript || interimTranscript)) {
      setInput(transcript || interimTranscript);
    }
  }, [isListening, transcript, interimTranscript]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, isListening]);

  // Voice State Machine (Section 8)
  const voiceState: VoiceAssistantState = speechError
    ? 'error'
    : isRequestingPermission
    ? 'requesting_permission'
    : isListening
    ? 'listening'
    : executingToolName
    ? 'executing_tool'
    : isProcessing
    ? 'processing'
    : isSpeaking
    ? 'speaking'
    : 'idle';

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isProcessing) return;

    let activeToken = token;

    // If user is not yet logged in or token missing, auto-login with instant verified demo session
    if (!user || !activeToken) {
      try {
        const demoToken = await quickDemoLogin();
        if (demoToken) {
          activeToken = demoToken;
        } else {
          const { data: sessionData } = await supabase.auth.getSession();
          activeToken = sessionData.session?.access_token || null;
        }
      } catch (err) {
        console.warn('Auto demo login for voice request:', err);
      }
    }

    if (!activeToken) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        activeToken = sessionData.session?.access_token || null;
      } catch {
        // ignore
      }
    }

    const userMessage: MessageItem = {
      id: String(Date.now()),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    stopSpeaking();
    clearError();

    // Check if query is likely a tool call to update orb state
    const lower = messageContent.toLowerCase();
    if (
      lower.includes('task') ||
      lower.includes('reminder') ||
      lower.includes('note') ||
      lower.includes('status')
    ) {
      setExecutingToolName('Supabase MCP Tool');
    }

    try {
      const history: ChatMessage[] = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.sendChatMessage(
        messageContent,
        history,
        activeToken,
        currentConversationId || undefined,
        userCoords || undefined
      );

      if (res.conversationId && (!currentConversationId || currentConversationId !== res.conversationId)) {
        if (onConversationCreated) {
          onConversationCreated(res.conversationId);
        }
      }

      const assistantMessage: MessageItem = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecutions: res.toolExecutions,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (res.followUpSuggestions && res.followUpSuggestions.length > 0) {
        setSuggestions(res.followUpSuggestions);
      }

      // Notify global audio player with full track info immediately
      const musicExec = res.toolExecutions?.find(t => t.name === 'play_music');
      if (musicExec && musicExec.result) {
        window.dispatchEvent(new CustomEvent('music-status-updated', { detail: musicExec.result }));
      }

      // Vocal text-to-speech output
      speak(res.response);
    } catch (err: any) {
      const isNetworkError = err.message === 'Failed to fetch' || err.name === 'TypeError';
      const errorMessage: MessageItem = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: isNetworkError
          ? 'Connecting to Alexa+ backend server... The backend service on Render is waking up. Please retry in a few moments.'
          : `Error: ${err.message || 'Failed to process request'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setExecutingToolName(null);
    }
  };

  const toggleToolDetails = (id: string) => {
    setExpandedTools(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full px-4 py-2">
      {/* Top Alexa Orb Section */}
      <div className="shrink-0 mb-2">
        <AlexaRing
          state={voiceState}
          onToggleMic={toggleListening}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onStopSpeaking={stopSpeaking}
          onRetry={toggleListening}
          currentToolName={executingToolName || undefined}
          errorMessage={speechError || undefined}
          size="sm"
        />

        {/* Live Active Voice Transcript Pill */}
        {isListening && (
          <div className="mt-2 max-w-md mx-auto p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-400/50 text-cyan-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-pulse">
            <div className="flex items-center gap-2 overflow-hidden">
              <Radio className="w-4 h-4 text-cyan-400 shrink-0 animate-ping" />
              <span className="truncate">
                {transcript || interimTranscript || 'Listening... Speak your request now'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={stopListening}
                className="px-2 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-[11px] transition-all"
              >
                Send
              </button>
              <button
                type="button"
                onClick={cancelListening}
                title="Cancel voice input"
                className="p-1 rounded text-cyan-300 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Error Announcement */}
        {speechError && (
          <div className="mt-2 max-w-md mx-auto p-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center justify-between gap-2">
            <span>{speechError}</span>
            <button
              onClick={clearError}
              className="p-0.5 text-red-400 hover:text-red-200"
              title="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Auth Banner if guest */}
      {!user && (
        <div className="shrink-0 mb-3 bg-[#111827] border border-cyan-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-300">
              You are browsing in guest mode. Log in to persist your personal tasks, reminders, and notes.
            </span>
          </div>
          <button
            onClick={() => quickDemoLogin()}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold tracking-wide transition-all shadow-md active:scale-95"
          >
            ⚡ Instant Demo Login
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {msg.role === 'user' ? user?.email?.split('@')[0] || 'You' : 'Alexa+ Assistant'}
                </span>
                <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => speak(msg.content)}
                      title="Speak this response aloud"
                      className="text-gray-500 hover:text-cyan-400 p-0.5 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      title="Copy response"
                      className="text-gray-500 hover:text-cyan-400 p-0.5 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-none'
                    : msg.isError
                    ? 'bg-red-950/40 border border-red-500/30 text-red-200 rounded-tl-none'
                    : 'bg-[#111827] border border-gray-800 text-gray-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Rich Multimodal Action Cards (Music, Recipes, Devices, Dining, Hotels, Calendar) */}
                {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                  <div className="space-y-2">
                    {msg.toolExecutions.map((tool, idx) => (
                      <AssistantActionCard key={`action-${idx}`} tool={tool} onSendMessage={handleSendMessage} />
                    ))}
                  </div>
                )}

                {/* Tool Execution Cards */}
                {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                    {msg.toolExecutions.map((tool, idx) => {
                      const toolKey = `${msg.id}-${idx}`;
                      const isExpanded = expandedTools[toolKey];
                      return (
                        <div
                          key={idx}
                          className="rounded-lg bg-[#0B0F19] border border-gray-700/60 p-2 text-xs"
                        >
                          <div
                            onClick={() => toggleToolDetails(toolKey)}
                            className="flex items-center justify-between cursor-pointer text-cyan-400 hover:text-cyan-300 font-mono select-none"
                          >
                            <div className="flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5" />
                              <span className="font-semibold">{tool.name}</span>
                              <span
                                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded ${
                                  tool.status === 'success'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {tool.status}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </div>

                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-gray-800/80 font-mono text-[11px] space-y-1">
                              <div>
                                <span className="text-gray-400">Arguments:</span>
                                <pre className="text-gray-300 bg-black/40 p-1.5 rounded mt-0.5 overflow-x-auto">
                                  {JSON.stringify(tool.args, null, 2)}
                                </pre>
                              </div>
                              {tool.result && (
                                <div>
                                  <span className="text-emerald-400">Result:</span>
                                  <pre className="text-gray-300 bg-black/40 p-1.5 rounded mt-0.5 overflow-x-auto">
                                    {JSON.stringify(tool.result, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {tool.error && (
                                <div>
                                  <span className="text-red-400">Error:</span>
                                  <pre className="text-red-300 bg-red-950/30 p-1.5 rounded mt-0.5">
                                    {tool.error}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-cyan-400 animate-pulse px-2"
          >
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Alexa+ is executing tools and reasoning...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Follow-up Suggestions Chips */}
      {suggestions.length > 0 && !isProcessing && (
        <div className="shrink-0 mb-2 flex items-center gap-2 overflow-x-auto py-1 text-xs">
          <span className="text-gray-400 whitespace-nowrap text-[11px] uppercase font-semibold">
            Suggested:
          </span>
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sug)}
              className="whitespace-nowrap px-3 py-1 rounded-full bg-[#1F2937]/70 hover:bg-cyan-500/20 border border-gray-700 hover:border-cyan-500/50 text-gray-300 hover:text-cyan-300 transition-all active:scale-95 text-xs"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="shrink-0 flex items-center gap-2 bg-[#111827] border border-gray-800 rounded-2xl p-2 focus-within:border-cyan-500/60 shadow-xl"
      >
        <button
          type="button"
          onClick={toggleListening}
          className={`p-2.5 rounded-xl transition-all ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-[#1F2937] text-cyan-400 hover:bg-cyan-500/20'
          }`}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={
            isListening
              ? 'Listening to your speech...'
              : 'Ask Alexa+ to create tasks, reminders, notes, or answer questions...'
          }
          disabled={isProcessing}
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-100 placeholder-gray-500 px-2"
        />

        {isSpeaking && (
          <button
            type="button"
            onClick={stopSpeaking}
            className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:bg-blue-600/50 transition-all"
            title="Stop speaking"
          >
            <StopCircle className="w-5 h-5" />
          </button>
        )}

        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
