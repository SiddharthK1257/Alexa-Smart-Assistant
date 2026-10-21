const API_BASE = '/api';

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
}

export interface ToolExecution {
  name: string;
  args: any;
  result?: any;
  error?: string;
  status: 'success' | 'failure';
  timestamp: string;
}

export interface AssistantChatResponse {
  response: string;
  toolExecutions: ToolExecution[];
  followUpSuggestions?: string[];
  conversationId?: string;
}

export interface ConversationItem {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageItemData {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
  tool_calls: ToolExecution[];
  created_at: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ReminderItem {
  id: string;
  message: string;
  scheduled_time: string;
  status: 'scheduled' | 'fired' | 'dismissed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AuditEventItem {
  id: string;
  event_type: string;
  tool_name: string | null;
  status: string;
  details: Record<string, any>;
  created_at: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP error ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Assistant
  sendChatMessage: (
    message: string,
    history: ChatMessage[],
    token: string | null,
    conversationId?: string
  ) =>
    request<AssistantChatResponse>(
      `${API_BASE}/assistant/chat`,
      {
        method: 'POST',
        body: JSON.stringify({ message, history, conversationId }),
      },
      token
    ),

  // Conversations
  getConversations: (token: string | null) =>
    request<{ conversations: ConversationItem[] }>(`${API_BASE}/conversations`, {}, token),

  getConversation: (id: string, token: string | null) =>
    request<{ conversation: ConversationItem; messages: MessageItemData[] }>(
      `${API_BASE}/conversations/${id}`,
      {},
      token
    ),

  createConversation: (title: string, token: string | null) =>
    request<{ conversation: ConversationItem }>(
      `${API_BASE}/conversations`,
      {
        method: 'POST',
        body: JSON.stringify({ title }),
      },
      token
    ),

  updateConversation: (id: string, title: string, token: string | null) =>
    request<{ conversation: ConversationItem }>(
      `${API_BASE}/conversations/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      },
      token
    ),

  deleteConversation: (id: string, token: string | null) =>
    request<{ deleted: boolean; conversationId: string }>(
      `${API_BASE}/conversations/${id}`,
      {
        method: 'DELETE',
      },
      token
    ),

  getConversationMessages: (id: string, token: string | null) =>
    request<{ messages: MessageItemData[] }>(`${API_BASE}/conversations/${id}/messages`, {}, token),

  // Tasks
  getTaskById: (id: string, token: string | null) =>
    request<{ task: TaskItem }>(`${API_BASE}/tasks/${id}`, {}, token),

  getTasks: (token: string | null, filter?: { status?: string; priority?: string }) => {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.priority) params.set('priority', filter.priority);
    return request<{ tasks: TaskItem[] }>(`${API_BASE}/tasks?${params.toString()}`, {}, token);
  },

  createTask: (
    task: { title: string; description?: string; priority?: string; due_date?: string },
    token: string | null
  ) =>
    request<{ task: TaskItem }>(
      `${API_BASE}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify(task),
      },
      token
    ),

  updateTask: (id: string, updates: Partial<TaskItem>, token: string | null) =>
    request<{ task: TaskItem }>(
      `${API_BASE}/tasks/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      token
    ),

  deleteTask: (id: string, token: string | null) =>
    request<{ deleted: boolean; taskId: string }>(
      `${API_BASE}/tasks/${id}?confirm=true`,
      {
        method: 'DELETE',
      },
      token
    ),

  // Reminders
  getReminderById: (id: string, token: string | null) =>
    request<{ reminder: ReminderItem }>(`${API_BASE}/reminders/${id}`, {}, token),

  getReminders: (token: string | null, status?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    return request<{ reminders: ReminderItem[] }>(`${API_BASE}/reminders?${params.toString()}`, {}, token);
  },

  createReminder: (reminder: { message: string; scheduled_time: string }, token: string | null) =>
    request<{ reminder: ReminderItem }>(
      `${API_BASE}/reminders`,
      {
        method: 'POST',
        body: JSON.stringify(reminder),
      },
      token
    ),

  updateReminder: (id: string, updates: Partial<ReminderItem>, token: string | null) =>
    request<{ reminder: ReminderItem }>(
      `${API_BASE}/reminders/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      token
    ),

  deleteReminder: (id: string, token: string | null) =>
    request<{ deleted: boolean; reminderId: string }>(
      `${API_BASE}/reminders/${id}?confirm=true`,
      {
        method: 'DELETE',
      },
      token
    ),

  // Notes
  getNoteById: (id: string, token: string | null) =>
    request<{ note: NoteItem }>(`${API_BASE}/notes/${id}`, {}, token),

  getNotes: (token: string | null, limit = 30) =>
    request<{ notes: NoteItem[] }>(`${API_BASE}/notes?limit=${limit}`, {}, token),

  searchNotes: (token: string | null, query = '', tag = '') => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (tag) params.set('tag', tag);
    return request<{ notes: NoteItem[] }>(`${API_BASE}/notes/search?${params.toString()}`, {}, token);
  },

  saveNote: (note: { title: string; content: string; tags?: string[] }, token: string | null) =>
    request<{ note: NoteItem }>(
      `${API_BASE}/notes`,
      {
        method: 'POST',
        body: JSON.stringify(note),
      },
      token
    ),

  updateNote: (id: string, updates: { title?: string; content?: string; tags?: string[] }, token: string | null) =>
    request<{ note: NoteItem }>(
      `${API_BASE}/notes/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      token
    ),

  deleteNote: (id: string, token: string | null) =>
    request<{ deleted: boolean; noteId: string }>(
      `${API_BASE}/notes/${id}?confirm=true`,
      {
        method: 'DELETE',
      },
      token
    ),

  // Profiles
  getProfile: (token: string | null) =>
    request<{ profile: any }>(`${API_BASE}/profile`, {}, token),

  updateProfile: (updates: { display_name?: string; preferences?: any }, token: string | null) =>
    request<{ profile: any }>(
      `${API_BASE}/profile`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      token
    ),

  // Audit Logs
  getAuditEvents: (token: string | null) =>
    request<{ auditEvents: AuditEventItem[] }>(`${API_BASE}/audit?limit=25`, {}, token),

  // System & Health
  getHealth: () => request<any>('/health'),

  // MCP
  getMcpTools: () => request<{ tools: Array<{ name: string; description: string }> }>('/mcp/tools'),

  executeMcpTool: (tool: string, args: any, token: string | null) =>
    request<any>(
      '/mcp/execute',
      {
        method: 'POST',
        body: JSON.stringify({ tool, arguments: args }),
      },
      token
    ),

  // OAuth Metadata & Flow
  getOAuthAuthorizationServerMetadata: () =>
    request<any>('/.well-known/oauth-authorization-server'),

  getOAuthProtectedResourceMetadata: () =>
    request<any>('/.well-known/oauth-protected-resource'),

  revokeOAuthToken: (tokenToRevoke: string, tokenTypeHint?: 'access_token' | 'refresh_token') =>
    request<{ revoked: boolean }>('/oauth/revoke', {
      method: 'POST',
      body: JSON.stringify({ token: tokenToRevoke, token_type_hint: tokenTypeHint }),
    }),
};
