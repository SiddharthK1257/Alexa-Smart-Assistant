import { z } from 'zod';
import * as taskService from '../services/taskService.js';
import * as reminderService from '../services/reminderService.js';
import * as noteService from '../services/noteService.js';
import * as deviceService from '../services/deviceService.js';
import * as musicService from '../services/musicService.js';
import * as recipeService from '../services/recipeService.js';
import * as openTableService from '../services/openTableService.js';
import * as hotelService from '../services/hotelService.js';
import * as calendarService from '../services/calendarService.js';
import { query } from '../db/supabase.js';
import { logAuditEvent } from '../db/audit.js';

// 1. Zod Schemas for Tool Arguments
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium').optional(),
});

export const listTasksSchema = z.object({
  status: z.enum(['all', 'pending', 'in_progress', 'completed', 'cancelled']).default('all').optional(),
  priority: z.enum(['all', 'low', 'medium', 'high', 'urgent']).default('all').optional(),
  limit: z.number().int().min(1).max(50).default(20).optional(),
});

export const updateTaskSchema = z.object({
  task_id: z.string().uuid('task_id must be a valid UUID'),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
});

export const completeTaskSchema = z.object({
  task_id: z.string().uuid('task_id must be a valid UUID'),
});

export const createReminderSchema = z.object({
  message: z.string().min(1, 'Reminder message is required'),
  scheduled_time: z.string().min(1, 'scheduled_time (ISO 8601 string) is required'),
});

export const listRemindersSchema = z.object({
  status: z.enum(['all', 'scheduled', 'fired', 'dismissed', 'cancelled']).default('scheduled').optional(),
  limit: z.number().int().min(1).max(50).default(20).optional(),
});

export const saveNoteSchema = z.object({
  title: z.string().min(1, 'Note title is required'),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]).optional(),
});

export const searchNotesSchema = z.object({
  query: z.string().optional(),
  tag: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10).optional(),
});

export const getAssistantStatusSchema = z.object({});

// --- Alexa+ Extended Tool Schemas ---
export const playMusicSchema = z.object({
  query: z.string().optional(),
  artist: z.string().optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  videoId: z.string().optional(),
  trackId: z.string().optional(),
  action: z.enum(['play', 'pause', 'resume', 'next', 'previous', 'stop']).default('play').optional(),
});

export const searchMusicSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
});

export const getPlaybackStatusSchema = z.object({});

export const searchRecipesSchema = z.object({
  query: z.string().optional(),
  cuisine: z.string().optional(),
  dietary: z.string().optional(),
});

export const getRecipeDetailsSchema = z.object({
  recipe_id_or_name: z.string().min(1),
});

export const discoverDevicesSchema = z.object({});

export const connectDeviceSchema = z.object({
  device_name: z.string().min(1),
});

export const controlDeviceSchema = z.object({
  device_name: z.string().min(1),
  power: z.boolean().optional(),
  volume: z.number().min(0).max(100).optional(),
  brightness: z.number().min(0).max(100).optional(),
  temperature: z.number().min(50).max(90).optional(),
});

export const checkOpenTableStatusSchema = z.object({});

export const linkOpenTableAccountSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  full_name: z.string().optional(),
});

export const searchRestaurantsSchema = z.object({
  cuisine: z.string().optional(),
  location: z.string().optional(),
});

export const bookRestaurantSchema = z.object({
  restaurant_name: z.string().min(1),
  party_size: z.number().int().min(1).max(20).default(2).optional(),
  date: z.string().min(1, 'Reservation date YYYY-MM-DD is required'),
  time: z.string().min(1, 'Reservation time HH:MM is required'),
  special_requests: z.string().optional(),
});

export const searchHotelsSchema = z.object({
  destination: z.string().optional(),
  min_rating: z.number().min(1).max(5).optional(),
  max_price: z.number().positive().optional(),
  continent: z.string().optional(),
  nearest: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  user_place: z.string().optional(),
});

export const bookHotelSchema = z.object({
  hotel_name: z.string().min(1),
  destination: z.string().optional(),
  check_in: z.string().min(1, 'Check-in date YYYY-MM-DD is required'),
  check_out: z.string().min(1, 'Check-out date YYYY-MM-DD is required'),
  guests: z.number().int().min(1).max(10).default(2).optional(),
  room_type: z.string().optional(),
});

export const getCalendarEventsSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const addCalendarEventSchema = z.object({
  title: z.string().min(1),
  event_type: z.enum(['hotel', 'restaurant', 'reminder', 'personal']).default('personal'),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  location: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

// Tool definitions catalog for MCP Server inspection
export const MCP_TOOLS_CATALOG = [
  {
    name: 'create_task',
    description: 'Create a new personal task with title, priority, due date, and optional description.',
    schema: createTaskSchema,
  },
  {
    name: 'list_tasks',
    description: 'List user tasks filtered by status (pending, in_progress, completed) or priority.',
    schema: listTasksSchema,
  },
  {
    name: 'update_task',
    description: 'Update the title, status, priority, or due date of an existing task by its UUID.',
    schema: updateTaskSchema,
  },
  {
    name: 'complete_task',
    description: 'Mark an existing task as completed by its UUID.',
    schema: completeTaskSchema,
  },
  {
    name: 'create_reminder',
    description: 'Schedule a time-based reminder with a message and ISO-8601 scheduled timestamp.',
    schema: createReminderSchema,
  },
  {
    name: 'list_reminders',
    description: 'List upcoming or active reminders for the current user.',
    schema: listRemindersSchema,
  },
  {
    name: 'save_note',
    description: 'Save or create a markdown note with title, content body, and tags.',
    schema: saveNoteSchema,
  },
  {
    name: 'search_notes',
    description: 'Search personal notes by keywords or filter by tags.',
    schema: searchNotesSchema,
  },
  {
    name: 'get_assistant_status',
    description: 'Get real-time operational status, database health, task counts, and system metrics.',
    schema: getAssistantStatusSchema,
  },
  {
    name: 'play_music',
    description: 'Play music, search songs, or play artists and genres via official YouTube music search and embedded player.',
    schema: playMusicSchema,
  },
  {
    name: 'search_music',
    description: 'Search for songs, music videos, or artists on YouTube to view matching search results.',
    schema: searchMusicSchema,
  },
  {
    name: 'get_playback_status',
    description: 'Get current track, audio playback status, volume, and upcoming playlist queue.',
    schema: getPlaybackStatusSchema,
  },
  {
    name: 'search_recipes',
    description: 'Search kitchen recipes with images, cooking instructions, and thorough allergen/safety assessments.',
    schema: searchRecipesSchema,
  },
  {
    name: 'get_recipe_details',
    description: 'Get detailed step-by-step instructions, ingredients, and allergen/safety warnings for a specific recipe.',
    schema: getRecipeDetailsSchema,
  },
  {
    name: 'discover_devices',
    description: 'Discover nearby smart home devices that Alexa can connect to, and view currently connected devices.',
    schema: discoverDevicesSchema,
  },
  {
    name: 'connect_device',
    description: 'Pair and connect a discovered smart home device (e.g. Echo Show 10, Philips Hue, Nest Thermostat).',
    schema: connectDeviceSchema,
  },
  {
    name: 'control_device',
    description: 'Control smart device settings such as power on/off, volume, brightness, or temperature.',
    schema: controlDeviceSchema,
  },
  {
    name: 'check_opentable_status',
    description: 'Verify if the user has connected an active OpenTable account for making restaurant bookings.',
    schema: checkOpenTableStatusSchema,
  },
  {
    name: 'link_opentable_account',
    description: 'Connect or link an OpenTable account to enable restaurant reservations through Alexa.',
    schema: linkOpenTableAccountSchema,
  },
  {
    name: 'search_restaurants',
    description: 'Search top-rated restaurants by cuisine or city with rich interior photos and available reservation slots.',
    schema: searchRestaurantsSchema,
  },
  {
    name: 'book_restaurant',
    description: 'Book a restaurant table via OpenTable (requires linked account). Automatically adds booking to user calendar.',
    schema: bookRestaurantSchema,
  },
  {
    name: 'search_hotels',
    description: 'Search luxury and boutique hotels worldwide with photography, ratings, amenities, and room pricing.',
    schema: searchHotelsSchema,
  },
  {
    name: 'book_hotel',
    description: 'Book a hotel stay with confirmation code. Automatically syncs check-in/out dates into user calendar.',
    schema: bookHotelSchema,
  },
  {
    name: 'get_calendar_events',
    description: 'Retrieve user calendar events, including booked hotels, restaurant reservations, and scheduled alarms.',
    schema: getCalendarEventsSchema,
  },
  {
    name: 'add_calendar_event',
    description: 'Add a new custom event, travel itinerary, or dining schedule to user calendar.',
    schema: addCalendarEventSchema,
  },
];

// Unified Tool Execution Handler
export async function executeMcpTool(toolName: string, args: any, userId: string): Promise<any> {
  if (!userId) {
    throw new Error('Authentication required: Cannot execute MCP tool without validated user identity');
  }

  const startTime = Date.now();

  try {
    let result: any;

    switch (toolName) {
      case 'create_task': {
        const validated = createTaskSchema.parse(args);
        result = await taskService.createTask(userId, validated);
        break;
      }

      case 'list_tasks': {
        const validated = listTasksSchema.parse(args);
        result = await taskService.listTasks(userId, validated);
        break;
      }

      case 'update_task': {
        const validated = updateTaskSchema.parse(args);
        const { task_id, ...updates } = validated;
        result = await taskService.updateTask(userId, task_id, updates);
        break;
      }

      case 'complete_task': {
        const validated = completeTaskSchema.parse(args);
        result = await taskService.updateTask(userId, validated.task_id, { status: 'completed' });
        break;
      }

      case 'create_reminder': {
        const validated = createReminderSchema.parse(args);
        result = await reminderService.createReminder(userId, validated);
        break;
      }

      case 'list_reminders': {
        const validated = listRemindersSchema.parse(args);
        result = await reminderService.listReminders(userId, validated);
        break;
      }

      case 'save_note': {
        const validated = saveNoteSchema.parse(args);
        result = await noteService.saveNote(userId, validated);
        break;
      }

      case 'search_notes': {
        const validated = searchNotesSchema.parse(args);
        result = await noteService.searchNotes(userId, validated);
        break;
      }

      case 'get_assistant_status': {
        getAssistantStatusSchema.parse(args);
        const [taskCounts, reminderCounts, noteCounts, deviceCounts, calendarCounts] = await Promise.all([
          query('SELECT status, count(*) FROM public.tasks WHERE user_id = $1 GROUP BY status', [userId]),
          query('SELECT status, count(*) FROM public.reminders WHERE user_id = $1 GROUP BY status', [userId]),
          query('SELECT count(*) FROM public.notes WHERE user_id = $1', [userId]),
          query('SELECT count(*) FROM public.devices WHERE user_id = $1', [userId]),
          query('SELECT count(*) FROM public.calendar_events WHERE user_id = $1', [userId]),
        ]);

        result = {
          assistant: 'Alexa+ Smart Assistant (Supabase Edition)',
          status: 'healthy',
          version: '1.2.0',
          mcpProtocolVersion: '2025-11-25',
          timestamp: new Date().toISOString(),
          uptimeSeconds: Math.floor(process.uptime()),
          userSummary: {
            tasksByStatus: Object.fromEntries(taskCounts.rows.map(r => [r.status, parseInt(r.count, 10)])),
            remindersByStatus: Object.fromEntries(reminderCounts.rows.map(r => [r.status, parseInt(r.count, 10)])),
            totalNotes: parseInt(noteCounts.rows[0]?.count || '0', 10),
            connectedDevices: parseInt(deviceCounts.rows[0]?.count || '0', 10),
            calendarEvents: parseInt(calendarCounts.rows[0]?.count || '0', 10),
          },
          database: 'connected (Supabase PostgreSQL)',
        };
        break;
      }

      // 🎵 Music Tools
      case 'play_music': {
        const validated = playMusicSchema.parse(args);
        if (validated.action === 'pause' || validated.action === 'stop') {
          result = await musicService.pauseMusic(userId);
        } else if (validated.action === 'resume') {
          result = await musicService.resumeMusic(userId);
        } else if (validated.action === 'next') {
          result = await musicService.nextTrack(userId);
        } else {
          result = await musicService.playMusic(userId, validated);
        }
        break;
      }

      case 'search_music': {
        const validated = searchMusicSchema.parse(args);
        result = await musicService.searchYouTubeTracks(validated.query);
        break;
      }

      case 'get_playback_status': {
        getPlaybackStatusSchema.parse(args);
        result = await musicService.getPlaybackStatus(userId);
        break;
      }

      // 🍳 Kitchen & Recipe Tools
      case 'search_recipes': {
        const validated = searchRecipesSchema.parse(args);
        result = await recipeService.searchRecipes(validated.query, validated.cuisine, validated.dietary);
        break;
      }

      case 'get_recipe_details': {
        const validated = getRecipeDetailsSchema.parse(args);
        result = recipeService.getRecipeDetails(validated.recipe_id_or_name);
        break;
      }

      // 📱 Smart Devices Tools
      case 'discover_devices': {
        discoverDevicesSchema.parse(args);
        const [devices, suggestions] = await Promise.all([
          deviceService.getDevices(userId),
          deviceService.getSuggestedDevices(userId),
        ]);
        result = {
          connectedDevices: devices,
          suggestedDevices: suggestions.suggestedDevices,
          proactiveTip: 'Alexa found nearby compatible devices ready for high-fidelity audio and smart home control.',
        };
        break;
      }

      case 'connect_device': {
        const validated = connectDeviceSchema.parse(args);
        result = await deviceService.connectDevice(userId, validated.device_name);
        break;
      }

      case 'control_device': {
        const validated = controlDeviceSchema.parse(args);
        const { device_name, ...settings } = validated;
        result = await deviceService.controlDevice(userId, device_name, settings);
        break;
      }

      // 🍽️ OpenTable Dining Tools
      case 'check_opentable_status': {
        checkOpenTableStatusSchema.parse(args);
        const account = await openTableService.getOpenTableAccount(userId);
        result = {
          isLinked: !!account?.is_linked,
          account: account || null,
          message: account?.is_linked
            ? `OpenTable account linked (${account.email}). You can book dining reservations instantly.`
            : 'No OpenTable account linked. Link your account to enable dining reservations.',
        };
        break;
      }

      case 'link_opentable_account': {
        const validated = linkOpenTableAccountSchema.parse(args);
        result = await openTableService.linkOpenTableAccount(userId, validated);
        break;
      }

      case 'search_restaurants': {
        const validated = searchRestaurantsSchema.parse(args);
        result = await openTableService.searchRestaurants(validated.cuisine, validated.location);
        break;
      }

      case 'book_restaurant': {
        const validated = bookRestaurantSchema.parse(args);
        result = await openTableService.bookRestaurant(userId, {
          restaurantName: validated.restaurant_name,
          partySize: validated.party_size,
          date: validated.date,
          time: validated.time,
          specialRequests: validated.special_requests,
        });
        break;
      }

      // 🏨 Hotel & Travel Tools
      case 'search_hotels': {
        const validated = searchHotelsSchema.parse(args);
        if (validated.nearest || (typeof validated.latitude === 'number' && typeof validated.longitude === 'number') || validated.user_place) {
          result = hotelService.searchNearestHotels(
            validated.latitude,
            validated.longitude,
            validated.user_place || validated.destination
          );
        } else {
          result = hotelService.searchHotels(
            validated.destination,
            validated.min_rating,
            validated.max_price,
            validated.continent
          );
        }
        break;
      }

      case 'book_hotel': {
        const validated = bookHotelSchema.parse(args);
        result = await hotelService.bookHotel(userId, {
          hotelName: validated.hotel_name,
          destination: validated.destination,
          checkIn: validated.check_in,
          checkOut: validated.check_out,
          guests: validated.guests,
          roomType: validated.room_type,
        });
        break;
      }

      // 📅 Calendar Tools
      case 'get_calendar_events': {
        const validated = getCalendarEventsSchema.parse(args);
        result = await calendarService.getCalendarEvents(userId, validated.start_date, validated.end_date);
        break;
      }

      case 'add_calendar_event': {
        const validated = addCalendarEventSchema.parse(args);
        result = await calendarService.addCalendarEvent(userId, validated);
        break;
      }

      default:
        throw new Error(`Unknown MCP tool: "${toolName}"`);
    }

    await logAuditEvent({
      userId,
      eventType: 'mcp_tool_execution',
      toolName,
      status: 'success',
      details: { executionDurationMs: Date.now() - startTime },
    });

    return result;

  } catch (error: any) {
    await logAuditEvent({
      userId,
      eventType: 'mcp_tool_execution',
      toolName,
      status: 'failure',
      details: { error: error.message, executionDurationMs: Date.now() - startTime },
    });
    throw error;
  }
}
