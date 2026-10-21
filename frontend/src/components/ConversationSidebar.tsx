import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, ConversationItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ConversationSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onToggleOpen,
}) => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadConversations = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await api.getConversations(token);
      setConversations(res.conversations || []);
    } catch {
      // Non-fatal
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && token) {
      loadConversations();
    } else {
      setConversations([]);
    }
  }, [user?.id, token, currentConversationId]);

  const handleStartRename = (e: React.MouseEvent, conv: ConversationItem) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!token || !editTitle.trim()) return;
    try {
      await api.updateConversation(id, editTitle.trim(), token);
      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, title: editTitle.trim() } : c))
      );
      setEditingId(null);
    } catch (err: any) {
      alert(`Failed to rename: ${err.message}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!token) return;
    if (!confirm(`Delete conversation "${title}"?`)) return;

    try {
      await api.deleteConversation(id, token);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        onNewConversation();
      }
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        title="Open conversation history"
        className="hidden md:flex items-center justify-center w-8 h-8 rounded-r-xl bg-[#111827] border-y border-r border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors fixed left-0 top-24 z-30 shadow-lg"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside className="w-72 shrink-0 bg-[#0E1422] border-r border-gray-800/80 flex flex-col h-full z-20 transition-all select-none">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-gray-800/80 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Chat History
        </span>
        <button
          onClick={onToggleOpen}
          className="p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#1F2937]"
          title="Close sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {!user ? (
          <div className="p-4 text-center text-xs text-gray-500">
            Sign in to save and browse your chat history across sessions.
          </div>
        ) : conversations.length === 0 && !isLoading ? (
          <div className="p-4 text-center text-xs text-gray-500">
            No previous conversations. Start chatting with Alexa+!
          </div>
        ) : (
          conversations.map(conv => {
            const isActive = currentConversationId === conv.id;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                  isActive
                    ? 'bg-[#1F2937] text-cyan-300 font-medium border border-cyan-500/30 shadow'
                    : 'text-gray-300 hover:bg-[#161F30] hover:text-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-gray-500'}`} />
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="bg-[#0B0F19] text-xs text-white px-1.5 py-0.5 rounded border border-cyan-500 outline-none w-full"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">{conv.title}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={e => handleSaveRename(e, conv.id)}
                        className="p-1 hover:text-emerald-400"
                        title="Save"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                        className="p-1 hover:text-red-400"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={e => handleStartRename(e, conv)}
                        className="p-1 text-gray-500 hover:text-cyan-400"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={e => handleDelete(e, conv.id, conv.title)}
                        className="p-1 text-gray-500 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer info */}
      <div className="p-3 border-t border-gray-800/80 text-[10px] text-gray-500 font-mono text-center">
        Supabase PostgreSQL History
      </div>
    </aside>
  );
};
