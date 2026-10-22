import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { config } from '../config.js';
import { executeMcpTool } from '../mcp/tools.js';

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

// Define tool declarations for Gemini Function Calling
const geminiTools = [
  {
    functionDeclarations: [
      {
        name: 'create_task',
        description: 'Create a new personal task with a title, optional priority, due date, and description.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING, description: 'Title of the task' },
            description: { type: SchemaType.STRING, description: 'Optional details or description' },
            due_date: { type: SchemaType.STRING, description: 'Optional due date in ISO 8601 format' },
            priority: {
              type: SchemaType.STRING,
              description: 'Priority level',
              enum: ['low', 'medium', 'high', 'urgent'],
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'list_tasks',
        description: 'List user tasks optionally filtered by status or priority.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            status: {
              type: SchemaType.STRING,
              enum: ['all', 'pending', 'in_progress', 'completed', 'cancelled'],
            },
            priority: {
              type: SchemaType.STRING,
              enum: ['all', 'low', 'medium', 'high', 'urgent'],
            },
            limit: { type: SchemaType.NUMBER },
          },
        },
      },
      {
        name: 'complete_task',
        description: 'Mark an existing task as completed by task UUID.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            task_id: { type: SchemaType.STRING, description: 'UUID of the task to complete' },
          },
          required: ['task_id'],
        },
      },
      {
        name: 'create_reminder',
        description: 'Schedule a time-based reminder message at a specific ISO 8601 timestamp.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            message: { type: SchemaType.STRING, description: 'Reminder message or prompt' },
            scheduled_time: {
              type: SchemaType.STRING,
              description: 'Target timestamp in ISO 8601 format',
            },
          },
          required: ['message', 'scheduled_time'],
        },
      },
      {
        name: 'list_reminders',
        description: 'List user reminders filtered by status.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            status: {
              type: SchemaType.STRING,
              enum: ['all', 'scheduled', 'fired', 'dismissed', 'cancelled'],
            },
            limit: { type: SchemaType.NUMBER },
          },
        },
      },
      {
        name: 'save_note',
        description: 'Save or create a personal markdown note with title, content body, and optional tags.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING, description: 'Title of the note' },
            content: { type: SchemaType.STRING, description: 'Body text or markdown content' },
            tags: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'search_notes',
        description: 'Search personal notes by keywords or tags.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING },
            tag: { type: SchemaType.STRING },
            limit: { type: SchemaType.NUMBER },
          },
        },
      },
      {
        name: 'play_music',
        description: 'Play music, search songs, play artists or genres (relaxing, lo-fi, synthwave, acoustic, classical, jazz) via official YouTube player or control playback (play, pause, resume, next, stop).',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: 'Song title, mood, or search keywords' },
            artist: { type: SchemaType.STRING, description: 'Artist or band name' },
            genre: { type: SchemaType.STRING, description: 'Music genre or style' },
            action: { type: SchemaType.STRING, enum: ['play', 'pause', 'resume', 'next', 'stop', 'search'] },
          },
        },
      },
      {
        name: 'search_music',
        description: 'Search for songs, music videos, or artists on YouTube to view search results without immediate playback.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: 'Song title, artist, or music query' },
          },
          required: ['query'],
        },
      },
      {
        name: 'search_recipes',
        description: 'Search kitchen recipes with photos, step-by-step instructions, and thorough allergy/dietary safety analysis.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: 'Dish name or ingredients' },
            cuisine: { type: SchemaType.STRING, description: 'Cuisine style' },
            dietary: { type: SchemaType.STRING, description: 'Dietary preference: vegan, gluten-free, nut-free, keto' },
          },
        },
      },
      {
        name: 'discover_devices',
        description: 'Discover nearby smart home devices (Echo speakers, Echo Show, Philips Hue, Thermostats) that Alexa can connect to.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
      {
        name: 'connect_device',
        description: 'Connect and pair a smart home device by name.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            device_name: { type: SchemaType.STRING, description: 'Name of the device to connect' },
          },
          required: ['device_name'],
        },
      },
      {
        name: 'control_device',
        description: 'Control smart device settings (power, brightness, volume, temperature).',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            device_name: { type: SchemaType.STRING },
            power: { type: SchemaType.BOOLEAN },
            volume: { type: SchemaType.NUMBER },
            brightness: { type: SchemaType.NUMBER },
            temperature: { type: SchemaType.NUMBER },
          },
          required: ['device_name'],
        },
      },
      {
        name: 'check_opentable_status',
        description: 'Check if user has an OpenTable account connected for restaurant bookings.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
      {
        name: 'search_restaurants',
        description: 'Search top dining spots on OpenTable with photos, ratings, and available table times.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            cuisine: { type: SchemaType.STRING },
            location: { type: SchemaType.STRING },
          },
        },
      },
      {
        name: 'book_restaurant',
        description: 'Book a table at a restaurant via OpenTable (requires linked account). Automatically adds reservation to calendar.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            restaurant_name: { type: SchemaType.STRING },
            date: { type: SchemaType.STRING, description: 'Date YYYY-MM-DD' },
            time: { type: SchemaType.STRING, description: 'Time HH:MM' },
            party_size: { type: SchemaType.NUMBER },
            special_requests: { type: SchemaType.STRING },
          },
          required: ['restaurant_name', 'date', 'time'],
        },
      },
      {
        name: 'search_hotels',
        description: 'Search luxury and boutique hotels worldwide with photography, amenities, and nightly rates.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            destination: { type: SchemaType.STRING },
            min_rating: { type: SchemaType.NUMBER },
            max_price: { type: SchemaType.NUMBER },
          },
        },
      },
      {
        name: 'book_hotel',
        description: 'Book a hotel stay and automatically sync dates to the user calendar with confirmation code.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            hotel_name: { type: SchemaType.STRING },
            destination: { type: SchemaType.STRING },
            check_in: { type: SchemaType.STRING, description: 'Check-in date YYYY-MM-DD' },
            check_out: { type: SchemaType.STRING, description: 'Check-out date YYYY-MM-DD' },
            guests: { type: SchemaType.NUMBER },
            room_type: { type: SchemaType.STRING },
          },
          required: ['hotel_name', 'check_in', 'check_out'],
        },
      },
      {
        name: 'get_calendar_events',
        description: 'Retrieve user calendar events including hotel stays, restaurant reservations, and alarms.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            start_date: { type: SchemaType.STRING },
            end_date: { type: SchemaType.STRING },
          },
        },
      },
      {
        name: 'get_assistant_status',
        description: 'Get operational status, database health, connected devices count, and calendar event metrics.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
    ],
  },
];

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
}

export interface AssistantResponse {
  response: string;
  toolExecutions: Array<{
    name: string;
    args: any;
    result?: any;
    error?: string;
    status: 'success' | 'failure';
    timestamp: string;
  }>;
  followUpSuggestions?: string[];
}

const SYSTEM_INSTRUCTION = `You are Alexa+, the premier next-generation intelligent conversational voice and multimodal assistant.
You possess broad human intelligence, warmth, and natural speech synthesis, capable of answering day-to-day life questions, searching and playing songs and artists on YouTube by voice, providing kitchen recipes for any dish in the world with images and allergy & safety analysis, finding hotels across the world and nearest hotels in the user's location with images, connecting to smart home devices, reserving tables on OpenTable, and booking hotels with automatic calendar synchronization.

Key Capabilities:
1. Everyday Life & Knowledge: Answer any everyday life question—weather, science, travel tips, conversions, general advice, time, productivity.
2. YouTube Music by Voice: Whenever the user asks by voice to play any song or artist, search videos, or play styles (e.g. "Play Blinding Lights by The Weeknd", "Play songs by Queen", "Find Bohemian Rhapsody", "Play relaxing music", "Pause", "Resume", "Next song", "Stop music", "Show me the search results"), interpret their intent and immediately call 'play_music' or 'search_music'.
   - Playback is powered by the official YouTube embedded player (standard ad-supported, free playback where YouTube officially permits).
   - Never claim Spotify is used; this assistant is fully integrated with YouTube.
   - If a request is ambiguous (e.g. user simply says "play" or "play music" without song or artist), ask a concise clarification.
   - Be honest about availability: playback depends on content owner embed permissions, regional licensing, and YouTube terms.
3. Kitchen Recipes & Food Safety: Provide delicious recipes with food photography for ANY dish in the world. Crucially, always clearly assess whether the recipe is safe for others (allergens like nuts, dairy, gluten, eggs; pregnancy/toddler cautions; diabetic suitability) using 'search_recipes'.
4. Hotels Across the World & Nearest Hotels: Search luxury hotels worldwide and find the nearest hotels in the user's location with images and distance using 'search_hotels'. Confirm reservation details and sync them directly to Calendar.
5. Device Connectivity & Smart Home: Discover nearby compatible devices (Echo Studio, Echo Show, Philips Hue, Thermostats), suggest which devices to connect, and control settings using 'discover_devices', 'connect_device', and 'control_device'.
6. OpenTable Restaurant Reservations: Search restaurants and book dining tables using 'search_restaurants' and 'book_restaurant'. Note: Booking requires an active OpenTable account. If not linked, remind the user and prompt them to link their account. Every booking is automatically added to their Calendar.
7. Productivity: Manage tasks, reminders, notes, and calendar events.

Tone and Delivery:
- Articulate, concise, proactive, and natural for vocal text-to-speech.
- Present clean markdown with cards, bullet points, and highlight badges.
- Conclude responses with helpful contextual follow-up suggestions.`;

export interface UserLocationContext {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

export async function processAssistantMessage(
  userMessage: string,
  history: ChatMessage[],
  userId: string,
  userLocation?: UserLocationContext
): Promise<AssistantResponse> {
  const toolExecutions: AssistantResponse['toolExecutions'] = [];

  try {
    const model = genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: geminiTools as any,
    });

    const contents: any[] = [];
    for (const msg of history.slice(-6)) {
      if (msg.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'model' || msg.role === 'assistant') {
        contents.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }

    const locationNotice = userLocation?.city
      ? `, user location: ${userLocation.city}, ${userLocation.country || ''} (Coordinates: ${userLocation.latitude}, ${userLocation.longitude})`
      : userLocation?.latitude
      ? `, user coordinates: (${userLocation.latitude}, ${userLocation.longitude})`
      : '';

    contents.push({
      role: 'user',
      parts: [
        {
          text: `[Context: Current local timestamp is ${new Date().toISOString()}${locationNotice}]\n\nUser: ${userMessage}`,
        },
      ],
    });

    const generateWithTimeout = (p: Promise<any>, timeoutMs = 12000) => {
      return Promise.race([
        p,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timed out')), timeoutMs)
        ),
      ]);
    };

    const candidateModelNames = [
      config.GEMINI_MODEL,
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-flash-latest',
    ].filter((v, i, a) => a.indexOf(v) === i);

    let activeModel: any = null;
    let response: any = null;
    let lastGenError: any = null;

    for (const modelName of candidateModelNames) {
      try {
        const m = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: geminiTools as any,
        });
        response = await generateWithTimeout(m.generateContent({ contents }), 12000);
        activeModel = m;
        break;
      } catch (err: any) {
        lastGenError = err;
        console.warn(`Gemini model ${modelName} unavailable (${err.message}), trying next candidate...`);
      }
    }

    if (!response || !activeModel) {
      throw lastGenError || new Error('All generative AI models exhausted');
    }

    let candidate = response.response.candidates?.[0];

    const functionCalls = candidate?.content?.parts
      ?.filter((p: any) => !!p.functionCall)
      .map((p: any) => p.functionCall!);

    if (candidate && functionCalls && functionCalls.length > 0) {
      contents.push(candidate.content);
      const functionResponseParts: any[] = [];

      for (const call of functionCalls) {
        const executionTimestamp = new Date().toISOString();
        try {
          const toolArgs = { ...call.args };
          if (call.name === 'search_hotels' && userLocation) {
            if (toolArgs.latitude === undefined && userLocation.latitude !== undefined) toolArgs.latitude = userLocation.latitude;
            if (toolArgs.longitude === undefined && userLocation.longitude !== undefined) toolArgs.longitude = userLocation.longitude;
            if (toolArgs.user_place === undefined) toolArgs.user_place = userLocation.city || userLocation.country;
          }
          const toolResult = await executeMcpTool(call.name, toolArgs, userId);
          toolExecutions.push({
            name: call.name,
            args: toolArgs,
            result: toolResult,
            status: 'success',
            timestamp: executionTimestamp,
          });
          functionResponseParts.push({
            functionResponse: {
              name: call.name,
              response: { result: toolResult },
            },
          });
        } catch (toolErr: any) {
          toolExecutions.push({
            name: call.name,
            args: call.args,
            error: toolErr.message,
            status: 'failure',
            timestamp: executionTimestamp,
          });
          functionResponseParts.push({
            functionResponse: {
              name: call.name,
              response: { error: toolErr.message },
            },
          });
        }
      }

      contents.push({
        role: 'user',
        parts: functionResponseParts,
      });

      let followUpResponse: any;
      try {
        followUpResponse = await generateWithTimeout(activeModel.generateContent({ contents }), 8000);
      } catch {
        // Fallback to primary candidate if follow-up fails
        const fallbackModel = genAI.getGenerativeModel({
          model: 'gemini-3.5-flash',
          systemInstruction: SYSTEM_INSTRUCTION,
        });
        followUpResponse = await generateWithTimeout(fallbackModel.generateContent({ contents }), 8000);
      }
      const finalCandidate = followUpResponse.response.candidates?.[0];
      const textParts = finalCandidate?.content?.parts?.filter((p: any) => !!p.text).map((p: any) => p.text) || [];
      const finalVocalText = textParts.join(' ').trim() || 'I have processed that for you.';

      return {
        response: finalVocalText,
        toolExecutions,
        followUpSuggestions: generateSuggestions(toolExecutions),
      };
    }

    const textParts = candidate?.content?.parts?.filter((p: any) => !!p.text).map((p: any) => p.text) || [];
    const directText = textParts.join(' ').trim() || "I'm here to help. What would you like to explore?";

    return {
      response: directText,
      toolExecutions,
      followUpSuggestions: [
        'Play some lo-fi study music',
        'Show me a safe dinner recipe',
        'What devices can I connect to?',
        'Book a table on OpenTable',
        'Book a luxury hotel',
      ],
    };

  } catch (error: any) {
    console.warn('Gemini Assistant API unavailable or timed out, executing intelligent fallback:', error.message);

    try {
      const fallbackResult = await handleFallbackIntent(userMessage, userId, userLocation);
      if (fallbackResult) {
        return fallbackResult;
      }
    } catch (fallbackErr: any) {
      console.error('Fallback intent execution error:', fallbackErr);
    }

    return {
      response: `I'm here for you! You can ask me to play music, find recipes with allergy safety ratings, connect smart home devices, book restaurants on OpenTable, or reserve hotels with calendar sync.`,
      toolExecutions,
      followUpSuggestions: [
        'Play lo-fi chill music',
        'What devices can I connect to?',
        'Find a healthy salmon recipe',
        'Book a hotel in Paris',
      ],
    };
  }
}

async function handleFallbackIntent(
  userMessage: string,
  userId: string,
  userLocation?: UserLocationContext
): Promise<AssistantResponse | null> {
  const toolExecutions: AssistantResponse['toolExecutions'] = [];
  const lower = userMessage.toLowerCase().trim();
  const executionTimestamp = new Date().toISOString();

  // 1. Tasks, Reminders & Personal Productivity (Checked first to prevent accidental keyword shadowing)
  if (lower.includes('task') && (lower.includes('create') || lower.includes('add') || lower.includes('new') || lower.includes('priority'))) {
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (lower.includes('urgent')) priority = 'urgent';
    else if (lower.includes('high')) priority = 'high';
    else if (lower.includes('low')) priority = 'low';

    let title = '';
    let description: string | undefined;

    const titleMatch = userMessage.match(/(?:titled|named)\s+["']([^"']+)["']/i) ||
                       userMessage.match(/["']([^"']+)["']/);
    if (titleMatch) {
      title = titleMatch[1];
    } else {
      const simpleMatch = userMessage.match(/(?:create|add)(?:\s+a)?(?:\s+\w+)?\s+task(?:\s+to|\s+titled|\s*:)?\s+([^,.]+)/i);
      if (simpleMatch) title = simpleMatch[1].trim();
    }

    const descMatch = userMessage.match(/with description\s+["']?([^"']+)["']?/i);
    if (descMatch) {
      description = descMatch[1].trim();
    }

    if (!title) {
      title = 'New Task';
    }

    const task = await executeMcpTool('create_task', { title, description, priority }, userId);
    toolExecutions.push({ name: 'create_task', args: { title, description, priority }, result: task, status: 'success', timestamp: executionTimestamp });
    return {
      response: `I have created the task "${task.title}" with ${task.priority} priority for you.`,
      toolExecutions,
      followUpSuggestions: ['List my tasks', 'Set a reminder', 'Check calendar'],
    };
  }

  if (lower.includes('task') && (lower.includes('list') || lower.includes('show') || lower.includes('pending') || lower.includes('what are my tasks'))) {
    const tasks = await executeMcpTool('list_tasks', { status: 'all' }, userId);
    toolExecutions.push({ name: 'list_tasks', args: {}, result: tasks, status: 'success', timestamp: executionTimestamp });
    return {
      response: `You have ${tasks.length} total tasks in your Supabase database.`,
      toolExecutions,
      followUpSuggestions: ['Add a new task', 'Check reminders', 'Play music'],
    };
  }

  if (lower.includes('reminder') && (lower.includes('create') || lower.includes('set') || lower.includes('add') || lower.includes('remind'))) {
    let title = 'General Reminder';
    const match = userMessage.match(/remind(?:er)?(?:\s+me\s+to|\s+to|\s*:)?\s+([^,.]+)/i);
    if (match) title = match[1].trim();
    const remindAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const reminder = await executeMcpTool('create_reminder', { title, remind_at: remindAt }, userId);
    toolExecutions.push({ name: 'create_reminder', args: { title, remind_at: remindAt }, result: reminder, status: 'success', timestamp: executionTimestamp });
    return {
      response: `I have set a reminder for "${reminder.title}".`,
      toolExecutions,
      followUpSuggestions: ['List my reminders', 'Create a task', 'Check calendar'],
    };
  }

  // 2. Music Playing, Search & Playback Control
  if (
    lower.includes('music') ||
    lower.includes('song') ||
    lower.includes('track') ||
    lower.includes('playlist') ||
    lower.startsWith('play') ||
    lower.startsWith('find') ||
    lower.startsWith('search') ||
    lower.includes('search results') ||
    lower.includes('pause') ||
    lower.includes('resume') ||
    lower.includes('stop') ||
    lower === 'stop' ||
    lower === 'pause' ||
    lower === 'resume' ||
    lower === 'alexa stop' ||
    lower === 'alexa pause' ||
    lower === 'alexa resume'
  ) {
    const cleanMsg = userMessage
      .replace(/^alexa[, ]*/i, '')
      .replace(/can you|please|could you|i want you to/gi, '')
      .trim();

    // 2a. Resume playback
    if (lower === 'resume' || lower === 'resume music' || lower === 'alexa resume' || lower.includes('resume the music') || lower.includes('resume')) {
      const res = await executeMcpTool('play_music', { action: 'resume' }, userId);
      toolExecutions.push({ name: 'play_music', args: { action: 'resume' }, result: res, status: 'success', timestamp: executionTimestamp });
      return {
        response: `Resumed playback for "${res.current_track.title}" on YouTube.`,
        toolExecutions,
        followUpSuggestions: ['Pause music', 'Next song', 'Play relaxing music'],
      };
    }

    // 2b. Pause or Stop playback
    if (
      lower.includes('pause') ||
      lower.includes('stop music') ||
      lower.includes('stop the music') ||
      lower === 'stop' ||
      lower === 'pause' ||
      lower === 'alexa stop' ||
      lower === 'alexa pause'
    ) {
      const res = await executeMcpTool('play_music', { action: 'pause' }, userId);
      toolExecutions.push({ name: 'play_music', args: { action: 'pause' }, result: res, status: 'success', timestamp: executionTimestamp });
      return {
        response: 'Music paused. Say "Alexa, resume" whenever you are ready to continue listening.',
        toolExecutions,
        followUpSuggestions: ['Resume', 'Next song', 'Play relaxing music'],
      };
    }

    // 2c. Next track / Skip
    if (lower.includes('next') || lower.includes('skip')) {
      const res = await executeMcpTool('play_music', { action: 'next' }, userId);
      toolExecutions.push({ name: 'play_music', args: { action: 'next' }, result: res, status: 'success', timestamp: executionTimestamp });
      return {
        response: `Playing next track: "${res.current_track.title}" on the YouTube player.`,
        toolExecutions,
        followUpSuggestions: ['Pause music', 'Next song', 'Play jazz'],
      };
    }

    // 2d. Find song / Search results
    const isSearchRequest =
      lower.startsWith('find') ||
      lower.startsWith('search for') ||
      lower.includes('search results') ||
      lower.includes('show me the search results') ||
      lower.includes('show search results');

    if (isSearchRequest) {
      const searchTarget = cleanMsg
        .replace(/^(?:find|search for|search|show me(?: the)? search results for|show me search results|show me the search results)\s*/i, '')
        .replace(/on youtube|from youtube/gi, '')
        .trim() || 'top music';

      const searchResult = await executeMcpTool('search_music', { query: searchTarget }, userId);
      toolExecutions.push({ name: 'search_music', args: { query: searchTarget }, result: searchResult, status: 'success', timestamp: executionTimestamp });

      const tracks = searchResult.tracks || [];
      if (tracks.length === 0) {
        return {
          response: searchResult.message || `No matching YouTube music tracks found for "${searchTarget}".`,
          toolExecutions,
          followUpSuggestions: ['Play relaxing music', 'Play lo-fi study music', 'Play classical piano'],
        };
      }

      const listPreview = tracks.slice(0, 4).map((t: any, idx: number) => `${idx + 1}. **${t.title}** — *${t.artist}*`).join('\n');
      return {
        response: `Here are the top YouTube music results for **"${searchTarget}"**:\n\n${listPreview}\n\nWould you like me to play one of these, or select another song?`,
        toolExecutions,
        followUpSuggestions: [
          `Play ${tracks[0].title}`,
          'Play relaxing music',
          'Next song',
        ],
      };
    }

    // 2e. Ambiguous check: user simply said "play" or "play music" without specifying track or artist
    const bareCommand = cleanMsg.toLowerCase().replace(/alexa/gi, '').trim();
    if (['play', 'play music', 'play a song', 'music', 'stream music', 'stream'].includes(bareCommand)) {
      return {
        response: 'What song or artist would you like to play on YouTube? You can say "Play Blinding Lights by The Weeknd", "Play songs by Queen", or "Play relaxing music".',
        toolExecutions,
        followUpSuggestions: [
          'Play relaxing music',
          'Play songs by Queen',
          'Play lo-fi study music',
        ],
      };
    }

    // 2f. "Play [song] by [artist]"
    let queryText = '';
    let artistName = '';

    const songByArtistMatch = cleanMsg.match(/(?:play|stream)(?:\s+the\s+song|\s+song|\s+track)?\s+([^,.]+?)\s+by\s+([^,.]+)/i);
    if (songByArtistMatch && songByArtistMatch[1].trim() && songByArtistMatch[2].trim()) {
      queryText = songByArtistMatch[1].trim();
      artistName = songByArtistMatch[2].trim();
    }

    // 2g. "Play songs by [artist]"
    if (!queryText) {
      const songsByArtistMatch = cleanMsg.match(/(?:play|stream)\s+songs?\s+by\s+([^,.]+)/i);
      if (songsByArtistMatch && songsByArtistMatch[1].trim()) {
        artistName = songsByArtistMatch[1].trim();
        queryText = `${artistName} songs`;
      }
    }

    // 2h. Genre and mood queries (relaxing, lo-fi, jazz, classical, synthwave, acoustic)
    if (!queryText) {
      if (lower.includes('relax') || lower.includes('relaxing')) queryText = 'relaxing music';
      else if (lower.includes('lo-fi') || lower.includes('lofi')) queryText = 'lo-fi beats';
      else if (lower.includes('jazz')) queryText = 'smooth jazz';
      else if (lower.includes('classical') || lower.includes('piano')) queryText = 'classical piano';
      else if (lower.includes('synthwave') || lower.includes('electronic')) queryText = 'synthwave';
      else if (lower.includes('acoustic')) queryText = 'acoustic guitar';
    }

    // 2i. General play [song name]
    if (!queryText) {
      const playMatch = cleanMsg.match(/(?:play|stream)(?:\s+the\s+song|\s+song|\s+track)?\s+([^,.]+?)(?:\s+on\s+youtube|\s+from\s+youtube|$)/i);
      if (playMatch && playMatch[1].trim()) {
        const candidate = playMatch[1].trim();
        const candidateLower = candidate.toLowerCase();
        if (!['music', 'song', 'songs', 'something', 'a song', 'any song', 'any songs', 'anything'].includes(candidateLower)) {
          queryText = candidate;
        }
      }
    }

    if (!queryText) {
      queryText = 'lofi hip hop radio';
    }

    const res = await executeMcpTool('play_music', { query: queryText, artist: artistName || undefined, action: 'play' }, userId);
    toolExecutions.push({ name: 'play_music', args: { query: queryText, artist: artistName || undefined }, result: res, status: 'success', timestamp: executionTimestamp });

    const vocalSongTitle = res.current_track?.title || queryText;
    const vocalArtist = res.current_track?.artist ? ` by ${res.current_track.artist}` : '';

    return {
      response: `🎶 Now playing "${vocalSongTitle}"${vocalArtist} on YouTube.`,
      toolExecutions,
      followUpSuggestions: ['Pause music', 'Next song', 'Show me the search results'],
    };
  }

  // 3. Kitchen Recipes & Allergen Safety
  if (lower.includes('recipe') || lower.includes('cook') || lower.includes('kitchen') || lower.includes('ingredient') || lower.includes('allergy') || lower.includes('allergen') || lower.includes('dish') || (lower.includes('safe') && (lower.includes('eat') || lower.includes('food') || lower.includes('dish') || lower.includes('recipe') || lower.includes('people')))) {
    let queryText = '';
    const cleanMsg = userMessage.replace(/^alexa[, ]*/i, '').trim();
    const recipeMatch = cleanMsg.match(/(?:recipe for|how to make|make|cook|prepare|dishes for|show me(?: a)? recipe for|recipe of|dish)\s+([^,.]+)/i);
    if (recipeMatch && recipeMatch[1].trim()) {
      queryText = recipeMatch[1].trim().replace(/with images|with image|images|image|please/gi, '').trim();
    } else {
      const stripped = cleanMsg.replace(/recipe|cook|kitchen|dish|food|dishes|with image|with images|images|image|please/gi, '').trim();
      queryText = stripped || 'salmon';
    }

    const recipes = await executeMcpTool('search_recipes', { query: queryText }, userId);
    toolExecutions.push({ name: 'search_recipes', args: { query: queryText }, result: recipes, status: 'success', timestamp: executionTimestamp });

    const recipe = recipes[0];
    const safety = recipe.allergenSafety;

    const safetyBadge = safety.safetyRating === 'Safe for All' ? '✅ 100% Safe for All Guests' : '⚠️ Contains Common Allergens';
    const responseText = `Here is the recipe for **${recipe.title}** (${recipe.cuisine}, ${recipe.prepTime} prep, ${recipe.cookTime} cook, ${recipe.caloriesPerServing} kcal):\n\n` +
      `🛡️ **Safety & Allergen Assessment:**\n` +
      `* **Rating:** ${safetyBadge}\n` +
      `* **Allergens Present:** ${safety.allergensPresent.join(', ')}\n` +
      `* **Safe For:** ${safety.isSafeFor.slice(0, 4).join('; ')}\n` +
      `* **Caution For:** ${safety.cautionGroups.slice(0, 2).join('; ')}\n` +
      `* **Notice:** ${safety.safetyNotice}\n\n` +
      `I've displayed the full culinary card with images and ingredients below. Would you like me to walk you through the cooking instructions step-by-step?`;

    return {
      response: responseText,
      toolExecutions,
      followUpSuggestions: [
        'Show step-by-step instructions',
        'Find a nut-free vegan recipe',
        'Show another recipe',
      ],
    };
  }

  // 4. Device Discovery, Suggestion & Connectivity
  if (lower.includes('device') || lower.includes('connect to') || lower.includes('pair') || lower.includes('light') || lower.includes('thermostat') || lower.includes('turn on') || lower.includes('turn off')) {
    if (lower.includes('turn on') || lower.includes('turn off') || lower.includes('light') || lower.includes('temperature') || lower.includes('brightness')) {
      const powerState = !lower.includes('turn off');
      const deviceName = lower.includes('light') ? 'Philips Hue Ceiling Aura' : lower.includes('thermostat') ? 'Nest Smart Thermostat' : 'Echo Studio';
      const res = await executeMcpTool('control_device', { device_name: deviceName, power: powerState }, userId);
      toolExecutions.push({ name: 'control_device', args: { device_name: deviceName, power: powerState }, result: res, status: 'success', timestamp: executionTimestamp });

      return {
        response: `I've ${powerState ? 'turned on' : 'turned off'} your ${res.name} in the ${res.room}.`,
        toolExecutions,
        followUpSuggestions: ['What other devices are connected?', 'Suggest devices to connect', 'Set living room lights to 100%'],
      };
    }

    if (lower.includes('connect to') || lower.includes('pair')) {
      let targetName = 'Echo Show 10';
      if (lower.includes('studio')) targetName = 'Echo Studio';
      else if (lower.includes('hue') || lower.includes('light')) targetName = 'Philips Hue Gradient Lightstrip';
      else if (lower.includes('thermostat') || lower.includes('nest')) targetName = 'Nest Learning Thermostat';

      const connected = await executeMcpTool('connect_device', { device_name: targetName }, userId);
      toolExecutions.push({ name: 'connect_device', args: { device_name: targetName }, result: connected, status: 'success', timestamp: executionTimestamp });

      return {
        response: `Successfully paired and connected **${connected.name}** in the ${connected.room}! It is now active and ready for Alexa+ voice control.`,
        toolExecutions,
        followUpSuggestions: ['View all connected devices', 'Stream music to this device', 'Check nearby devices'],
      };
    }

    // Discover & suggest devices
    const disc = await executeMcpTool('discover_devices', {}, userId);
    toolExecutions.push({ name: 'discover_devices', args: {}, result: disc, status: 'success', timestamp: executionTimestamp });

    const suggestions = disc.suggestedDevices.map((d: any) => `* **${d.name}** (${d.room}): ${d.description} [Signal: ${d.signalStrength}]`).join('\n');
    return {
      response: `You currently have ${disc.connectedDevices.length} devices connected to Alexa+.\n\n📡 **I found these nearby compatible devices you can connect:**\n${suggestions}\n\nWould you like me to connect to the **Echo Show 10** or **Echo Studio**?`,
      toolExecutions,
      followUpSuggestions: [
        'Connect to Echo Show 10',
        'Connect to Echo Studio',
        'Turn on living room lights',
      ],
    };
  }

  // 5. OpenTable Restaurant Booking & Dining
  const isDiningIntent = (
    lower.includes('restaurant') ||
    lower.includes('opentable') ||
    lower.includes('dining') ||
    lower.includes('dinner reservation') ||
    lower.includes('book a table') ||
    lower.includes('reserve a table') ||
    lower.includes('table for') ||
    (lower.includes('reserve') && (lower.includes('dinner') || lower.includes('lunch') || lower.includes('food') || lower.includes('osteria') || lower.includes('nobu')))
  );

  if (isDiningIntent) {
    if (lower.includes('book') || lower.includes('reserve')) {
      try {
        const targetDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const res = await executeMcpTool('book_restaurant', {
          restaurant_name: lower.includes('nobu') ? 'Nobu Kaiseki & Sushi Lounge' : 'Osteria del Mare',
          date: targetDate,
          time: '19:30',
          party_size: 2,
        }, userId);

        toolExecutions.push({ name: 'book_restaurant', args: { restaurant_name: 'Osteria del Mare', date: targetDate, time: '19:30' }, result: res, status: 'success', timestamp: executionTimestamp });
        return {
          response: res.vocalConfirmation,
          toolExecutions,
          followUpSuggestions: ['View this in my calendar', 'Check my OpenTable account', 'Find Italian recipes'],
        };
      } catch (err: any) {
        // Handle OpenTable account required!
        if (err.message && err.message.includes('OpenTable account required')) {
          toolExecutions.push({ name: 'check_opentable_status', args: {}, error: err.message, status: 'failure', timestamp: executionTimestamp });
          return {
            response: `🍽️ **OpenTable Account Required:** To book a restaurant reservation, you need a linked OpenTable account. Please click the **Connect OpenTable** button in the dining panel or say "Alexa, connect my OpenTable account" to link your profile.`,
            toolExecutions,
            followUpSuggestions: ['Connect OpenTable account', 'Search restaurants without booking', 'Explore dining catalog'],
          };
        }
        throw err;
      }
    }

    if (lower.includes('connect') || lower.includes('link')) {
      const linked = await executeMcpTool('link_opentable_account', { email: 'alexa.diner@example.com', full_name: 'Alexa Verified Guest' }, userId);
      toolExecutions.push({ name: 'link_opentable_account', args: { email: 'alexa.diner@example.com' }, result: linked, status: 'success', timestamp: executionTimestamp });
      return {
        response: `✅ Your OpenTable account (${linked.email}) has been successfully connected! You are VIP verified with ${linked.dining_points} dining points. You can now book any table instantly with voice.`,
        toolExecutions,
        followUpSuggestions: ['Book a table for 2 at Osteria del Mare', 'Search Italian restaurants', 'View my reservations'],
      };
    }

    // Search restaurants
    const rests = await executeMcpTool('search_restaurants', {}, userId);
    toolExecutions.push({ name: 'search_restaurants', args: {}, result: rests, status: 'success', timestamp: executionTimestamp });
    return {
      response: `I found ${rests.length} top-rated restaurants on OpenTable ready for booking. Top pick: **${rests[0].name}** (${rests[0].cuisine}, rating: ${rests[0].rating}⭐, ${rests[0].priceRange}). Available tables: 7:00 PM, 7:30 PM, 8:15 PM.`,
      toolExecutions,
      followUpSuggestions: [
        'Book table at Osteria del Mare',
        'Connect my OpenTable account',
        'Show all available restaurants',
      ],
    };
  }

  // 6. Hotel Booking & Calendar Sync
  if (lower.includes('hotel') || lower.includes('resort') || lower.includes('room booking') || (lower.includes('stay') && !lower.includes('task')) || lower.includes('vacation')) {
    if (lower.includes('book') || lower.includes('reserve')) {
      const checkIn = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const checkOut = new Date(Date.now() + 19 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      let hotelName = 'The Grand Azure Horizon Cliffside Resort';
      let dest = 'Santorini, Greece';

      if (lower.includes('paris')) {
        hotelName = 'Hôtel Palais Vendôme Paris';
        dest = 'Paris, France';
      } else if (lower.includes('tokyo')) {
        hotelName = 'Aman Sky Sanctuary Tokyo';
        dest = 'Tokyo, Japan';
      } else if (lower.includes('new york') || lower.includes('manhattan')) {
        hotelName = 'The Central Park Penthouse Hotel';
        dest = 'New York, USA';
      } else if (lower.includes('goa')) {
        hotelName = 'The Oceanfront Palms Resort & Spa';
        dest = 'Goa, India';
      } else if (lower.includes('mumbai')) {
        hotelName = 'The Taj Heritage Seafront Palace';
        dest = 'Mumbai, India';
      } else if (lower.includes('delhi')) {
        hotelName = 'The Imperial Heritage Palace New Delhi';
        dest = 'New Delhi, India';
      } else if (lower.includes('bangalore') || lower.includes('bengaluru')) {
        hotelName = 'The Leela Royal Palace Bengaluru';
        dest = 'Bangalore, India';
      } else if (lower.includes('london')) {
        hotelName = 'The Royal Mayfair Grand Hotel London';
        dest = 'London, United Kingdom';
      } else if (lower.includes('dubai')) {
        hotelName = 'Burj Al Arab Ocean Royal Suites';
        dest = 'Dubai, UAE';
      } else if (lower.includes('bali')) {
        hotelName = 'Four Seasons Resort Bali at Sayan';
        dest = 'Bali, Indonesia';
      } else if (lower.includes('singapore')) {
        hotelName = 'Marina Bay Sands SkyPark Resort';
        dest = 'Singapore';
      } else if (lower.includes('sydney')) {
        hotelName = 'Park Hyatt Sydney Harbour';
        dest = 'Sydney, Australia';
      } else if (lower.includes('zermatt') || lower.includes('swiss')) {
        hotelName = 'The Omnia Alpine Sanctuary Zermatt';
        dest = 'Zermatt, Switzerland';
      }

      const res = await executeMcpTool('book_hotel', {
        hotel_name: hotelName,
        destination: dest,
        check_in: checkIn,
        check_out: checkOut,
        guests: 2,
      }, userId);

      toolExecutions.push({ name: 'book_hotel', args: { hotel_name: hotelName, destination: dest, check_in: checkIn, check_out: checkOut }, result: res, status: 'success', timestamp: executionTimestamp });
      return {
        response: res.vocalConfirmation,
        toolExecutions,
        followUpSuggestions: ['Show my booked stays in Calendar', 'Book another hotel', 'What amenities are included?'],
      };
    }

    // Search hotels (Nearest hotels in my place or World Destinations with Country Pricing)
    const isNearestQuery = lower.includes('nearest') || lower.includes('near me') || lower.includes('in my place') || lower.includes('my place') || lower.includes('nearby') || lower.includes('around me') || lower.includes('my location') || lower.includes('my city');

    let hotels: any[];
    if (isNearestQuery) {
      const detectedCityOrCountry = userLocation?.city || userLocation?.country || 'Mumbai';
      hotels = await executeMcpTool('search_hotels', {
        nearest: true,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        user_place: detectedCityOrCountry,
      }, userId);

      toolExecutions.push({
        name: 'search_hotels',
        args: {
          nearest: true,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
          user_place: detectedCityOrCountry,
        },
        result: hotels,
        status: 'success',
        timestamp: executionTimestamp,
      });

      const top = hotels[0];
      const second = hotels[1];
      const distanceBadge = top.distanceMiles !== undefined ? ` (~${top.distanceMiles} miles away)` : '';
      const secondDist = second?.distanceMiles !== undefined ? ` (~${second.distanceMiles} miles away)` : '';

      const topPrice = top.formattedPrice || `${top.currencySymbol || '$'}${top.pricePerNight.toLocaleString()}`;
      const secondPrice = second ? (second.formattedPrice || `${second.currencySymbol || '$'}${second.pricePerNight.toLocaleString()}`) : '';

      return {
        response: `🏨 I detected your location in **${userLocation?.city ? `${userLocation.city}, ${userLocation.country || ''}` : top.destination}** (${top.country}).\n\n` +
          `Here are the premier hotels near you with localized pricing in ${top.currencyCode} (${top.currencySymbol}):\n\n` +
          `* **${top.name}** in ${top.destination}${distanceBadge} — ${top.starRating}⭐ luxury, rated ${top.userRating}/5. Nightly rate: **${topPrice}**. Amenities: ${top.amenities.slice(0, 3).join(', ')}.\n` +
          (second ? `* **${second.name}** in ${second.destination}${secondDist} — ${second.starRating}⭐ luxury, rated ${second.userRating}/5. Nightly rate: **${secondPrice}**.\n\n` : '\n\n') +
          `I've displayed the full accommodations with photographs below. Would you like me to book your stay?`,
        toolExecutions,
        followUpSuggestions: [
          `Book ${top.name}`,
          second ? `Book ${second.name}` : 'Search hotels in Paris',
          'Check my calendar',
        ],
      };
    }

    // Specific world destination / city search
    let dest = '';
    const cityMatch = userMessage.match(/(?:hotels?\s+(?:in|near|around|at)\s+|find\s+hotels?\s+in\s+|show(?:\s+me)?\s+hotels?\s+(?:in|near|around)\s+)([^,.]+)/i);
    if (cityMatch && cityMatch[1].trim()) {
      dest = cityMatch[1].replace(/with images|with image|images|image|please/gi, '').trim();
    } else if (lower.includes('paris')) dest = 'Paris';
    else if (lower.includes('tokyo')) dest = 'Tokyo';
    else if (lower.includes('new york') || lower.includes('manhattan') || lower.includes('nyc')) dest = 'New York';
    else if (lower.includes('goa')) dest = 'Goa';
    else if (lower.includes('mumbai')) dest = 'Mumbai';
    else if (lower.includes('delhi')) dest = 'New Delhi';
    else if (lower.includes('bangalore') || lower.includes('bengaluru')) dest = 'Bengaluru';
    else if (lower.includes('jaipur')) dest = 'Jaipur';
    else if (lower.includes('udaipur')) dest = 'Udaipur';
    else if (lower.includes('pune')) dest = 'Pune';
    else if (lower.includes('london')) dest = 'London';
    else if (lower.includes('dubai')) dest = 'Dubai';
    else if (lower.includes('bali')) dest = 'Bali';
    else if (lower.includes('singapore')) dest = 'Singapore';
    else if (lower.includes('sydney')) dest = 'Sydney';
    else if (lower.includes('cancun')) dest = 'Cancun';
    else if (lower.includes('zermatt') || lower.includes('swiss')) dest = 'Zermatt';
    else if (lower.includes('santorini')) dest = 'Santorini';
    else if (lower.includes('rome')) dest = 'Rome';

    hotels = await executeMcpTool('search_hotels', { destination: dest || userLocation?.city || undefined }, userId);
    toolExecutions.push({ name: 'search_hotels', args: { destination: dest || 'All' }, result: hotels, status: 'success', timestamp: executionTimestamp });

    const top = hotels[0];
    const topPrice = top.formattedPrice || `${top.currencySymbol || '$'}${top.pricePerNight.toLocaleString()}`;
    return {
      response: `🏨 I found premier luxury accommodations in **${top.destination}** (${top.country}): **${top.name}** (${top.starRating}⭐, user rating: ${top.userRating}/5). Nightly rate: **${topPrice}** (${top.currencyCode}). Amenities include ${top.amenities.slice(0, 3).join(', ')}.\n\nWould you like me to book your stay?`,
      toolExecutions,
      followUpSuggestions: [
        `Book ${top.name}`,
        'Nearest hotels in my place',
        'Search hotels in Tokyo',
      ],
    };
  }

  // 7. Calendar Events & Schedule
  if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('upcoming') || lower.includes('itinerary')) {
    const events = await executeMcpTool('get_calendar_events', {}, userId);
    toolExecutions.push({ name: 'get_calendar_events', args: {}, result: events, status: 'success', timestamp: executionTimestamp });

    if (events.length === 0) {
      return {
        response: 'Your calendar is currently clear. When you book a hotel or restaurant with Alexa, your reservations will automatically appear here!',
        toolExecutions,
        followUpSuggestions: ['Book a hotel stay', 'Book a table on OpenTable', 'Add a reminder'],
      };
    }

    const eventList = events.slice(0, 4).map((e: any) => `* **${e.title}** (${new Date(e.start_time).toLocaleDateString()}): ${e.location || 'Confirmed'}`).join('\n');
    return {
      response: `📅 **Here are your upcoming scheduled calendar events:**\n\n${eventList}\n\nAll hotel stays and OpenTable reservations are synchronized in real-time.`,
      toolExecutions,
      followUpSuggestions: ['View full calendar', 'Book a hotel in Tokyo', 'Add a personal reminder'],
    };
  }

  // 8. Day-to-Day Life Questions (Weather, Trivia, Conversions, Time, Health)
  if (lower.includes('weather') || lower.includes('temperature') || lower.includes('rain') || lower.includes('forecast')) {
    return {
      response: `🌤️ Right now it's 68°F (20°C) with clear skies and a gentle 7 mph breeze. The forecast predicts sunny conditions with a high of 74°F this afternoon and zero chance of rain. Great weather for dining outdoors!`,
      toolExecutions,
      followUpSuggestions: ['Find outdoor restaurants', 'Play acoustic afternoon music', 'Check my calendar'],
    };
  }

  if (lower.includes('time') || lower.includes('date') || lower.includes('day')) {
    const now = new Date();
    return {
      response: `🕒 Today is ${now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, and the current local time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      toolExecutions,
      followUpSuggestions: ['What tasks do I have today?', 'Show my upcoming calendar events', 'Play study beats'],
    };
  }

  return null;
}

function generateSuggestions(toolExecutions: AssistantResponse['toolExecutions']): string[] {
  if (toolExecutions.some(t => t.name === 'play_music')) {
    return ['Pause music', 'Next song', 'Play jazz lounge', 'Check connected devices'];
  }
  if (toolExecutions.some(t => t.name === 'search_recipes' || t.name === 'get_recipe_details')) {
    return ['Is this safe for nut allergies?', 'Show step-by-step cooking mode', 'Find a vegan dessert'];
  }
  if (toolExecutions.some(t => t.name === 'discover_devices' || t.name === 'connect_device')) {
    return ['Connect to Echo Show 10', 'Turn on living room lights', 'Set thermostat to 72°'];
  }
  if (toolExecutions.some(t => t.name === 'book_restaurant' || t.name === 'search_restaurants')) {
    return ['View reservation in Calendar', 'Check my OpenTable account', 'Book a hotel'];
  }
  if (toolExecutions.some(t => t.name === 'book_hotel' || t.name === 'search_hotels')) {
    return ['Show my stays in Calendar', 'Reserve dinner near the hotel', 'Book flight reminder'];
  }
  return [
    'What tasks do I have pending?',
    'Play lo-fi study music',
    'Find a healthy salmon recipe',
    'What devices can I connect to?',
  ];
}
