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
} from 'lucide-react';
import { api, ChatMessage, ToolExecution } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { AlexaRing } from './AlexaRing';

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
        'Hello! I am your Alexa+ Smart Assistant, powered by Google Gemini and Supabase PostgreSQL with the Model Context Protocol. How can I help you manage your tasks, reminders, or notes today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    'What tasks do I have pending?',
    'Add a high priority task to review security audit',
    'Set a reminder to stretch in 30 minutes',
    'Save a note about project architecture',
    'What is your system status?',
  ]);

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
              'Hello! I am your Alexa+ Smart Assistant, powered by Google Gemini and Supabase PostgreSQL with the Model Context Protocol. How can I help you manage your tasks, reminders, or notes today?',
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

  // Speech Recognition hook
  const {
    isListening,
    transcript,
    interimTranscript,
    toggleListening,
    error: speechError,
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
  }, [messages, isProcessing]);

  // Determine current Alexa ring state
  const ringState: 'idle' | 'listening' | 'processing' | 'speaking' = isListening
    ? 'listening'
    : isProcessing
    ? 'processing'
    : isSpeaking
    ? 'speaking'
    : 'idle';

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isProcessing) return;

    if (!user) {
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now()),
          role: 'user',
          content: messageContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content:
            'Please log in with Supabase Auth or use Instant Demo Login below to manage your personal tasks, reminders, and notes.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
      setInput('');
      return;
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

    try {
      const history: ChatMessage[] = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.sendChatMessage(
        messageContent,
        history,
        token,
        currentConversationId || undefined
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

      // Vocal text-to-speech output
      speak(res.response);
    } catch (err: any) {
      const errorMessage: MessageItem = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to process request'}. Please check your database connection or login state.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
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
          state={ringState}
          onToggleMic={toggleListening}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          size="sm"
        />
        {speechError && (
          <p className="text-center text-xs text-amber-400 mt-1">{speechError}</p>
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
                      title="Speak this response"
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
              ? 'Listening to speech...'
              : 'Ask Alexa+ to create tasks, reminders, notes, or answer questions...'
          }
          disabled={isProcessing}
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-100 placeholder-gray-500 px-2"
        />

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
