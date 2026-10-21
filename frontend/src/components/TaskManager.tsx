import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Circle, Clock, Trash2, AlertCircle, Filter, Calendar } from 'lucide-react';
import { api, TaskItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const TaskManager: React.FC = () => {
  const { user, token, quickDemoLogin } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // New task form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load tasks from backend
  const loadTasks = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTasks(token, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      });
      setTasks(data.tasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && token) {
      loadTasks();
    } else {
      setTasks([]);
    }
  }, [user?.id, token, statusFilter, priorityFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !token) return;
    setIsSubmitting(true);
    try {
      const res = await api.createTask(
        {
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          priority: newPriority,
          due_date: newDueDate ? new Date(newDueDate).toISOString() : undefined,
        },
        token
      );
      setTasks(prev => [res.task, ...prev]);
      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (task: TaskItem) => {
    if (!token) return;
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';

    // Optimistic update
    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await api.updateTask(task.id, { status: nextStatus }, token);
    } catch (err: any) {
      // Revert on error
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, status: task.status } : t))
      );
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete task "${title}"?`)) return;
    if (!token) return;

    // Optimistic remove
    const originalTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await api.deleteTask(taskId, token);
    } catch (err: any) {
      setTasks(originalTasks);
      alert(`Failed to delete task: ${err.message}`);
    }
  };

  const priorityColors = {
    low: 'text-gray-400 bg-gray-500/10 border-gray-600/30',
    medium: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    high: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    urgent: 'text-red-400 bg-red-500/10 border-red-500/30 font-semibold',
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-[#111827] border border-cyan-500/30 text-cyan-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-100">Sign in to access your Task Dashboard</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Tasks are secured using Supabase PostgreSQL Row Level Security (RLS). Only authenticated owners can read or write their tasks.
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
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <span>Task Manager</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              {tasks.length} total
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Persisted in Supabase PostgreSQL with real-time MCP tool execution
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#111827] border border-gray-800/80 rounded-xl p-3 text-xs">
        <div className="flex items-center gap-1.5 text-gray-400 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#1F2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-200 outline-none focus:border-cyan-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="bg-[#1F2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-200 outline-none focus:border-cyan-500"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <button
          onClick={loadTasks}
          disabled={isLoading}
          className="ml-auto text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Task List */}
      {error && (
        <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {tasks.length === 0 && !isLoading ? (
        <div className="bg-[#111827] border border-gray-800/80 rounded-2xl p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-semibold text-gray-300">No tasks found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You can create a task here or simply tell Alexa: "Add a task to buy groceries".
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map(task => {
            const isDone = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`bg-[#111827] border rounded-xl p-4 transition-all flex items-start justify-between gap-4 hover:border-gray-700 ${
                  isDone ? 'border-gray-800/50 opacity-60' : 'border-gray-800'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="mt-0.5 text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1 flex-1">
                    <h3
                      className={`text-sm font-medium ${
                        isDone ? 'line-through text-gray-400' : 'text-gray-100'
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span
                        className={`px-2 py-0.5 rounded-full border uppercase tracking-wider text-[10px] ${
                          priorityColors[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(task.due_date).toLocaleDateString()}</span>
                        </span>
                      )}
                      <span className="text-gray-500 capitalize">
                        Status: {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id, task.title)}
                  className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-100">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-medium">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Prepare presentation for team sync"
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-gray-100 outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Add details, links, or notes..."
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-gray-100 outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-gray-100 outline-none focus:border-cyan-500 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-gray-100 outline-none focus:border-cyan-500 text-sm"
                  />
                </div>
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
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
