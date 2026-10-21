import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Tag, Trash2, AlertCircle } from 'lucide-react';
import { api, NoteItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const NoteManager: React.FC = () => {
  const { user, token, quickDemoLogin } = useAuth();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Note Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadNotes = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      if (searchQuery.trim() || selectedTag) {
        const data = await api.searchNotes(token, searchQuery.trim(), selectedTag || '');
        setNotes(data.notes);
      } else {
        const data = await api.getNotes(token);
        setNotes(data.notes);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      const delay = setTimeout(() => {
        loadNotes();
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setNotes([]);
    }
  }, [user, token, searchQuery, selectedTag]);

  // Extract unique tags across all notes
  const allTags = Array.from(
    new Set(notes.flatMap(n => n.tags || []).filter(Boolean))
  );

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !token) return;
    setIsSubmitting(true);

    const tagsArray = newTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    try {
      const res = await api.saveNote(
        {
          title: newTitle.trim(),
          content: newContent.trim(),
          tags: tagsArray,
        },
        token
      );
      setNotes(prev => [res.note, ...prev]);
      setShowAddModal(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
    } catch (err: any) {
      alert(`Error saving note: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string, title: string) => {
    if (!confirm(`Delete note "${title}"?`)) return;
    if (!token) return;
    const original = [...notes];
    setNotes(prev => prev.filter(n => n.id !== noteId));
    try {
      await api.deleteNote(noteId, token);
    } catch (err: any) {
      setNotes(original);
      alert(`Failed to delete note: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-[#111827] border border-cyan-500/30 text-cyan-400">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-100">Sign in to access your Note Library</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Save markdown notes, search via keywords, and access them conversationally through Alexa+.
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
            <span>Note Library</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              {notes.length} saved
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Markdown notes and semantic summaries indexed in PostgreSQL
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search & Tag Filter Toolbar */}
      <div className="space-y-3 bg-[#111827] border border-gray-800/80 rounded-xl p-3 text-xs">
        <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-gray-200">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes by keywords (title or content)..."
            className="w-full bg-transparent border-none outline-none text-xs text-gray-100 placeholder-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-200 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-gray-400 text-[11px] mr-1">Tags:</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded-full text-[11px] transition-colors ${
                selectedTag === null
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-full text-[11px] transition-colors flex items-center gap-1 ${
                  selectedTag === tag
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Notes Grid */}
      {notes.length === 0 && !isLoading ? (
        <div className="bg-[#111827] border border-gray-800/80 rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-semibold text-gray-300">No notes found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Say: "Alexa, save a note about our MCP architecture" or click New Note above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <div
              key={note.id}
              className="bg-[#111827] border border-gray-800 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-gray-700 transition-all shadow-md group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-100 group-hover:text-cyan-300 transition-colors">
                    {note.title}
                  </h3>
                  <button
                    onClick={() => handleDeleteNote(note.id, note.title)}
                    className="text-gray-500 hover:text-red-400 p-0.5 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed line-clamp-4 whitespace-pre-wrap font-mono">
                  {note.content}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-800/80">
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map(t => (
                      <span
                        key={t}
                        className="text-[10px] bg-cyan-950/40 border border-cyan-800/30 text-cyan-300 px-2 py-0.5 rounded"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-[10px] text-gray-500">
                  Updated: {new Date(note.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-100">Create Note</h2>
            <form onSubmit={handleCreateNote} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-medium">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Gemini Function Calling Notes"
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-gray-100 outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Content *</label>
                <textarea
                  rows={6}
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Write your markdown note content here..."
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-gray-100 outline-none focus:border-cyan-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="e.g. ai, gemini, supabase, mcp"
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
                  disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  {isSubmitting ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
