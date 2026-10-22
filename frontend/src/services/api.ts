const DEFAULT_BACKEND_URL = import.meta.env.DEV ? '' : 'https://alexa-smart-assistant.onrender.com';
export const BACKEND_URL = (import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL).replace(/\/+$/, '');
const API_BASE = `${BACKEND_URL}/api`;

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

// Extended Alexa+ Feature Interfaces
export interface SmartDevice {
  id: string;
  user_id: string;
  name: string;
  type: string;
  room: string;
  is_connected: boolean;
  status: string;
  settings: {
    power?: boolean;
    volume?: number;
    brightness?: number;
    temperature?: number;
    mode?: string;
    [key: string]: any;
  };
}

export interface SuggestedDevice {
  name: string;
  type: string;
  room: string;
  description: string;
  icon: string;
  signalStrength: string;
  protocol: string;
}

export interface MusicTrack {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  channelTitle?: string;
  album?: string;
  duration: number;
  durationFormatted?: string;
  album_art: string;
  thumbnail?: string;
  genre?: string;
  mood?: string;
  youtube_url: string;
  embed_url: string;
  source: 'YouTube';
  description?: string;
  publishedAt?: string;
}

export interface MusicPlaybackState {
  current_track: MusicTrack;
  is_playing: boolean;
  progress_seconds: number;
  volume: number;
  queue: MusicTrack[];
  api_configured?: boolean;
  message?: string;
  error?: string | null;
}

export interface RecipeAllergenInfo {
  safetyRating: 'Safe for All' | 'Contains Common Allergens' | 'Special Dietary Caution';
  allergensPresent: string[];
  isSafeFor: string[];
  cautionGroups: string[];
  safetyNotice: string;
  populationWarnings?: {
    pregnancyCaution?: string;
    toddlerCaution?: string;
    diabeticCaution?: string;
  };
}

export interface KitchenRecipe {
  id: string;
  title: string;
  description: string;
  cuisine: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: number;
  caloriesPerServing: number;
  difficulty: 'Easy' | 'Intermediate' | 'Advanced';
  imageUrl: string;
  ingredients: string[];
  instructions: string[];
  dietaryTags: string[];
  allergenSafety: RecipeAllergenInfo;
}

export interface OpenTableAccount {
  id: string;
  user_id: string;
  email: string;
  phone?: string;
  full_name: string;
  is_linked: boolean;
  vip_status: boolean;
  dining_points: number;
}

export interface RestaurantItem {
  id: string;
  name: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  reviewsCount: number;
  location: string;
  neighborhood: string;
  imageUrl: string;
  availableTimes: string[];
  description: string;
}

export interface RestaurantReservation {
  id: string;
  restaurant_name: string;
  cuisine: string;
  location: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  image_url: string;
  confirmation_code: string;
  status: string;
  special_requests?: string;
}

export interface HotelListing {
  id: string;
  name: string;
  destination: string;
  city: string;
  country: string;
  continent?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  distanceMiles?: number;
  starRating: number;
  userRating: number;
  reviewsCount: number;
  pricePerNight: number;
  currencySymbol?: string;
  currencyCode?: string;
  formattedPrice?: string;
  imageUrl: string;
  gallery: string[];
  roomTypes: Array<{
    type: string;
    price: number;
    formattedPrice?: string;
    bed: string;
    view: string;
  }>;
  amenities: string[];
  description: string;
  locationDetails: string;
}

export interface HotelBooking {
  id: string;
  hotel_name: string;
  destination: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  room_type: string;
  total_price: number;
  image_url: string;
  confirmation_code: string;
  rating: number;
  status: string;
  amenities: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: 'hotel' | 'restaurant' | 'reminder' | 'personal';
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
  image_url?: string;
  reference_id?: string;
  status: string;
  metadata?: Record<string, any>;
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
    const err: any = new Error(data.message || data.error || `HTTP error ${res.status}`);
    err.status = res.status;
    err.requiresOpenTable = data.requiresOpenTable;
    throw err;
  }

  return data as T;
}

export const api = {
  // Assistant
  sendChatMessage: (
    message: string,
    history: ChatMessage[],
    token: string | null,
    conversationId?: string,
    userLocation?: { latitude?: number; longitude?: number; city?: string; country?: string }
  ) =>
    request<AssistantChatResponse>(
      `${API_BASE}/assistant/chat`,
      {
        method: 'POST',
        body: JSON.stringify({ message, history, conversationId, userLocation }),
      },
      token
    ),

  // Conversations
  listConversations: (token: string | null) =>
    request<{ conversations: ConversationItem[] }>(`${API_BASE}/conversations`, {}, token),
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

  updateConversationTitle: (id: string, title: string, token: string | null) =>
    request<{ conversation: ConversationItem }>(
      `${API_BASE}/conversations/${id}`,
      {
        method: 'PATCH',
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
    request<{ deleted: boolean }>(
      `${API_BASE}/conversations/${id}`,
      {
        method: 'DELETE',
      },
      token
    ),

  // Tasks
  listTasks: (token: string | null, status = 'all') =>
    request<{ tasks: TaskItem[] }>(`${API_BASE}/tasks?status=${status}`, {}, token),
  getTasks: (token: string | null, filter: string | { status?: string; priority?: string } = 'all') => {
    let url = `${API_BASE}/tasks`;
    if (typeof filter === 'string') {
      url += `?status=${filter}`;
    } else {
      const p = new URLSearchParams();
      if (filter.status) p.set('status', filter.status);
      if (filter.priority) p.set('priority', filter.priority);
      url += `?${p.toString()}`;
    }
    return request<{ tasks: TaskItem[] }>(url, {}, token);
  },

  createTask: (task: { title: string; description?: string; priority?: string; due_date?: string }, token: string | null) =>
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
  listReminders: (token: string | null, status = 'scheduled') =>
    request<{ reminders: ReminderItem[] }>(`${API_BASE}/reminders?status=${status}`, {}, token),
  getReminders: (token: string | null, status = 'scheduled') =>
    request<{ reminders: ReminderItem[] }>(`${API_BASE}/reminders?status=${status}`, {}, token),

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
  listNotes: (token: string | null) =>
    request<{ notes: NoteItem[] }>(`${API_BASE}/notes`, {}, token),
  getNotes: (token: string | null) =>
    request<{ notes: NoteItem[] }>(`${API_BASE}/notes`, {}, token),

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
  getHealth: () => request<any>(`${BACKEND_URL}/health`),

  // MCP
  getMcpTools: () => request<{ tools: Array<{ name: string; description: string }> }>(`${BACKEND_URL}/mcp/tools`),

  executeMcpTool: (tool: string, args: any, token: string | null) =>
    request<any>(
      `${BACKEND_URL}/mcp/execute`,
      {
        method: 'POST',
        body: JSON.stringify({ tool, arguments: args }),
      },
      token
    ),

  // --- 📱 Connected Devices ---
  getDevices: (token: string | null) =>
    request<{ devices: SmartDevice[] }>(`${API_BASE}/devices`, {}, token),

  getSuggestedDevices: (token: string | null) =>
    request<{ connectedCount: number; totalRegistered: number; suggestedDevices: SuggestedDevice[] }>(
      `${API_BASE}/devices/suggestions`,
      {},
      token
    ),

  connectDevice: (deviceName: string, token: string | null) =>
    request<{ success: boolean; device: SmartDevice }>(
      `${API_BASE}/devices/connect`,
      {
        method: 'POST',
        body: JSON.stringify({ device_name: deviceName }),
      },
      token
    ),

  controlDevice: (deviceName: string, settings: Record<string, any>, token: string | null) =>
    request<{ success: boolean; device: SmartDevice }>(
      `${API_BASE}/devices/control`,
      {
        method: 'POST',
        body: JSON.stringify({ device_name: deviceName, ...settings }),
      },
      token
    ),

  // --- 🎵 YouTube Music Playback ---
  getMusicStatus: (token: string | null) =>
    request<MusicPlaybackState>(`${API_BASE}/music/status`, {}, token),

  getMusicConfig: (token: string | null) =>
    request<{ configured: boolean; source: string; message: string }>(`${API_BASE}/music/config`, {}, token),

  searchMusic: (query: string, token: string | null = null) =>
    request<{ tracks: MusicTrack[]; configured?: boolean; error?: string; message?: string }>(
      `${API_BASE}/music/search?q=${encodeURIComponent(query)}`,
      {},
      token
    ),

  playMusic: (options: { query?: string; artist?: string; genre?: string; mood?: string; trackId?: string; videoId?: string }, token: string | null) =>
    request<MusicPlaybackState>(
      `${API_BASE}/music/play`,
      {
        method: 'POST',
        body: JSON.stringify(options),
      },
      token
    ),

  controlMusic: (action: 'pause' | 'resume' | 'next' | 'volume' | 'stop', volume?: number, token?: string | null) =>
    request<MusicPlaybackState>(
      `${API_BASE}/music/control`,
      {
        method: 'POST',
        body: JSON.stringify({ action, volume }),
      },
      token
    ),

  // --- 🍳 Kitchen Recipes ---
  getRecipes: (query = '', cuisine = '', dietary = '', token: string | null = null) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (cuisine) params.set('cuisine', cuisine);
    if (dietary) params.set('dietary', dietary);
    return request<{ recipes: KitchenRecipe[] }>(`${API_BASE}/recipes?${params.toString()}`, {}, token);
  },

  getRecipeDetails: (id: string, token: string | null = null) =>
    request<{ recipe: KitchenRecipe }>(`${API_BASE}/recipes/${id}`, {}, token),

  // --- 🍽️ OpenTable Dining ---
  getOpenTableAccount: (token: string | null) =>
    request<{ isLinked: boolean; account: OpenTableAccount | null }>(`${API_BASE}/opentable/account`, {}, token),

  linkOpenTableAccount: (data: { email: string; phone?: string; full_name?: string }, token: string | null) =>
    request<{ success: boolean; account: OpenTableAccount }>(
      `${API_BASE}/opentable/link`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    ),

  getRestaurants: (cuisine = '', location = '', token: string | null = null) => {
    const params = new URLSearchParams();
    if (cuisine) params.set('cuisine', cuisine);
    if (location) params.set('location', location);
    return request<{ restaurants: RestaurantItem[] }>(`${API_BASE}/opentable/restaurants?${params.toString()}`, {}, token);
  },

  bookRestaurant: (data: { restaurant_name: string; party_size?: number; date: string; time: string; special_requests?: string }, token: string | null) =>
    request<{ reservation: RestaurantReservation; restaurant: RestaurantItem; vocalConfirmation: string }>(
      `${API_BASE}/opentable/book`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    ),

  getUserReservations: (token: string | null) =>
    request<{ reservations: RestaurantReservation[] }>(`${API_BASE}/opentable/reservations`, {}, token),

  // --- 🏨 Hotel Bookings ---
  getHotels: (
    destination = '',
    minRating?: number,
    maxPrice?: number,
    continent?: string,
    nearest?: boolean,
    lat?: number,
    lng?: number,
    place?: string,
    token: string | null = null
  ) => {
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (minRating) params.set('min_rating', String(minRating));
    if (maxPrice) params.set('max_price', String(maxPrice));
    if (continent && continent !== 'All') params.set('continent', continent);
    if (nearest) params.set('nearest', 'true');
    if (typeof lat === 'number') params.set('lat', String(lat));
    if (typeof lng === 'number') params.set('lng', String(lng));
    if (place) params.set('place', place);
    return request<{ hotels: HotelListing[] }>(`${API_BASE}/hotels?${params.toString()}`, {}, token);
  },

  getNearestHotels: (lat?: number, lng?: number, place?: string, token: string | null = null) => {
    const params = new URLSearchParams();
    if (typeof lat === 'number') params.set('lat', String(lat));
    if (typeof lng === 'number') params.set('lng', String(lng));
    if (place) params.set('place', place);
    return request<{ hotels: HotelListing[] }>(`${API_BASE}/hotels/nearest?${params.toString()}`, {}, token);
  },

  bookHotel: (data: { hotel_name: string; destination?: string; check_in: string; check_out: string; guests?: number; room_type?: string }, token: string | null) =>
    request<{ booking: HotelBooking; hotel: HotelListing; vocalConfirmation: string }>(
      `${API_BASE}/hotels/book`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    ),

  getUserHotelBookings: (token: string | null) =>
    request<{ bookings: HotelBooking[] }>(`${API_BASE}/hotels/bookings`, {}, token),

  // --- 📅 Calendar Events ---
  getCalendarEvents: (token: string | null, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    return request<{ events: CalendarEvent[] }>(`${API_BASE}/calendar?${params.toString()}`, {}, token);
  },

  addCalendarEvent: (event: Partial<CalendarEvent>, token: string | null) =>
    request<{ success: boolean; event: CalendarEvent }>(
      `${API_BASE}/calendar`,
      {
        method: 'POST',
        body: JSON.stringify(event),
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
