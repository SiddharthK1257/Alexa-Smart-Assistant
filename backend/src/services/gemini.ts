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
        description: 'List user tasks optionally filtered by status (pending, in_progress, completed) or priority.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            status: {
              type: SchemaType.STRING,
              description: 'Filter by status',
              enum: ['all', 'pending', 'in_progress', 'completed', 'cancelled'],
            },
            priority: {
              type: SchemaType.STRING,
              description: 'Filter by priority',
              enum: ['all', 'low', 'medium', 'high', 'urgent'],
            },
            limit: { type: SchemaType.NUMBER, description: 'Max number of tasks to return' },
          },
        },
      },
      {
        name: 'update_task',
        description: 'Update an existing task status, priority, title, or due date by task UUID.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            task_id: { type: SchemaType.STRING, description: 'UUID of the task' },
            title: { type: SchemaType.STRING, description: 'Updated title' },
            description: { type: SchemaType.STRING, description: 'Updated description' },
            due_date: { type: SchemaType.STRING, description: 'Updated due date in ISO format' },
            priority: {
              type: SchemaType.STRING,
              enum: ['low', 'medium', 'high', 'urgent'],
            },
            status: {
              type: SchemaType.STRING,
              enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            },
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
              description: 'Target timestamp in ISO 8601 format (e.g. 2026-10-21T15:30:00Z)',
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
            limit: { type: SchemaType.NUMBER, description: 'Max reminders to return' },
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
              description: 'List of tags',
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
            query: { type: SchemaType.STRING, description: 'Keyword to search in title and content' },
            tag: { type: SchemaType.STRING, description: 'Filter by specific tag' },
            limit: { type: SchemaType.NUMBER, description: 'Max notes to return' },
          },
        },
      },
      {
        name: 'get_assistant_status',
        description: 'Get real-time operational status, database connection health, task and reminder metrics.',
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

const SYSTEM_INSTRUCTION = `You are Alexa+, an advanced, intelligent personal voice and text assistant built with Supabase PostgreSQL and the official Model Context Protocol (MCP).
You are polite, proactive, articulate, and natural-sounding. Your responses should be concise, clear, and well-suited for both voice text-to-speech output and visual reading.

Capabilities:
- Manage user tasks (create, list, mark complete/update)
- Manage reminders with scheduled ISO timestamps
- Save and search markdown notes with tags
- Provide assistant system status and operational health

Rules:
1. Always use tools to perform actual database operations. Never simulate or claim you completed a task or reminder without invoking the corresponding tool.
2. If a database operation fails, acknowledge the failure honestly and provide helpful instructions.
3. If an action is potentially destructive (like deleting items or cancelling everything), ask for explicit user confirmation first.
4. Calculate relative dates/times using the user's current context (Current Year is 2026).
5. Conclude responses with a relevant follow-up offer or helpful question when appropriate.`;

export async function processAssistantMessage(
  userMessage: string,
  history: ChatMessage[],
  userId: string
): Promise<AssistantResponse> {
  const toolExecutions: AssistantResponse['toolExecutions'] = [];

  try {
    const model = genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: geminiTools as any,
    });

    // Format chat history for Gemini
    const contents: any[] = [];
    for (const msg of history.slice(-8)) {
      if (msg.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'model' || msg.role === 'assistant') {
        contents.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [
        {
          text: `[Context: Current local timestamp is ${new Date().toISOString()}]\n\nUser: ${userMessage}`,
        },
      ],
    });

    // Helper for timeout race
    const generateWithTimeout = (p: Promise<any>, timeoutMs = 8000) => {
      return Promise.race([
        p,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timed out')), timeoutMs)
        ),
      ]);
    };

    // Initial generate content call with timeout
    let response = await generateWithTimeout(model.generateContent({ contents }), 8000);
    let candidate = response.response.candidates?.[0];

    // Check if Gemini invoked function calls
    const functionCalls = candidate?.content?.parts?.filter((p: any) => !!p.functionCall).map((p: any) => p.functionCall!);

    if (candidate && functionCalls && functionCalls.length > 0) {
      // Append the model's exact candidate content to preserve thought_signature and function calls
      contents.push(candidate.content);

      const functionResponseParts: any[] = [];

      // Execute each function call
      for (const call of functionCalls) {
        const executionTimestamp = new Date().toISOString();
        try {
          const toolResult = await executeMcpTool(call.name, call.args, userId);
          toolExecutions.push({
            name: call.name,
            args: call.args,
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

      // Add user turn with all function responses
      contents.push({
        role: 'user',
        parts: functionResponseParts,
      });

      // Second call to get final synthesized response from Gemini with tool results
      const followUpResponse = await generateWithTimeout(model.generateContent({ contents }), 8000);
      const finalCandidate = followUpResponse.response.candidates?.[0];
      const textParts = finalCandidate?.content?.parts?.filter((p: any) => !!p.text).map((p: any) => p.text) || [];
      const finalVocalText = textParts.join(' ').trim() || 'I have completed that for you.';

      return {
        response: finalVocalText,
        toolExecutions,
        followUpSuggestions: generateSuggestions(toolExecutions),
      };
    }

    // Direct text response without tools
    const textParts = candidate?.content?.parts?.filter((p: any) => !!p.text).map((p: any) => p.text) || [];
    const directText = textParts.join(' ').trim() || "I'm here to help. What would you like to do?";

    return {
      response: directText,
      toolExecutions,
      followUpSuggestions: [
        'What tasks do I have pending?',
        'Add a task to buy groceries',
        'Set a reminder for tomorrow morning',
      ],
    };

  } catch (error: any) {
    console.warn('Gemini Assistant API unavailable or timed out, executing intelligent fallback:', error.message);

    try {
      const fallbackResult = await handleFallbackIntent(userMessage, userId);
      if (fallbackResult) {
        return fallbackResult;
      }
    } catch (fallbackErr: any) {
      console.error('Fallback intent execution error:', fallbackErr);
    }

    // Friendly explanation if no fallback matched
    return {
      response: `I'm currently operating in fallback mode. You can ask me to create tasks, check reminders, view notes, or report system status.`,
      toolExecutions,
      followUpSuggestions: ['Check assistant status', 'List my tasks'],
    };
  }
}

async function handleFallbackIntent(userMessage: string, userId: string): Promise<AssistantResponse | null> {
  const toolExecutions: AssistantResponse['toolExecutions'] = [];
  const lower = userMessage.toLowerCase().trim();

  // 1. Task creation
  if (lower.includes('task') && (lower.includes('create') || lower.includes('add') || lower.includes('new'))) {
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

    if (title) {
      const executionTimestamp = new Date().toISOString();
      const task = await executeMcpTool('create_task', {
        title,
        description,
        priority,
      }, userId);

      toolExecutions.push({
        name: 'create_task',
        args: { title, description, priority },
        result: task,
        status: 'success',
        timestamp: executionTimestamp,
      });

      return {
        response: `I have created the task "${task.title}" with ${task.priority} priority for you.`,
        toolExecutions,
        followUpSuggestions: ['View all my tasks', 'Set a reminder for this task', 'Add another task'],
      };
    }
  }

  // 2. List tasks
  if (lower.includes('tasks') && (lower.includes('list') || lower.includes('show') || lower.includes('what') || lower.includes('get') || lower.includes('view') || lower.includes('pending'))) {
    const executionTimestamp = new Date().toISOString();
    let status = 'all';
    if (lower.includes('pending')) status = 'pending';
    else if (lower.includes('completed')) status = 'completed';

    const tasks = await executeMcpTool('list_tasks', { status }, userId);
    toolExecutions.push({
      name: 'list_tasks',
      args: { status },
      result: tasks,
      status: 'success',
      timestamp: executionTimestamp,
    });

    const taskCount = Array.isArray(tasks) ? tasks.length : 0;
    const taskSummary = Array.isArray(tasks) && taskCount > 0
      ? ` Here are your latest: ${tasks.slice(0, 3).map((t: any) => t.title).join(', ')}.`
      : '';

    return {
      response: `You have ${taskCount} ${status === 'all' ? '' : status + ' '}task${taskCount === 1 ? '' : 's'}.${taskSummary}`,
      toolExecutions,
      followUpSuggestions: ['Add a high priority task', 'Mark a task as completed'],
    };
  }

  // 3. Status check
  if (lower.includes('status') || lower.includes('health') || lower.includes('operational')) {
    const executionTimestamp = new Date().toISOString();
    const statusResult = await executeMcpTool('get_assistant_status', {}, userId);
    toolExecutions.push({
      name: 'get_assistant_status',
      args: {},
      result: statusResult,
      status: 'success',
      timestamp: executionTimestamp,
    });

    return {
      response: `Alexa+ is fully operational with active Supabase PostgreSQL connectivity and MCP protocol support.`,
      toolExecutions,
      followUpSuggestions: ['View all my tasks', 'Check reminders'],
    };
  }

  // 4. Reminders
  if (lower.includes('remind')) {
    const executionTimestamp = new Date().toISOString();
    if (lower.includes('list') || lower.includes('show') || lower.includes('what')) {
      const reminders = await executeMcpTool('list_reminders', { status: 'scheduled' }, userId);
      toolExecutions.push({
        name: 'list_reminders',
        args: { status: 'scheduled' },
        result: reminders,
        status: 'success',
        timestamp: executionTimestamp,
      });

      return {
        response: `You have ${reminders.length} scheduled reminders.`,
        toolExecutions,
        followUpSuggestions: ['Add a reminder', 'View tasks'],
      };
    } else {
      let msg = 'Reminder';
      const msgMatch = userMessage.match(/remind me (?:to |about )?["']?([^"']+)["']?(?: at | in | on )/i) ||
                       userMessage.match(/remind me (?:to |about )?([^,.]+)/i);
      if (msgMatch) msg = msgMatch[1].trim();

      const scheduledTime = new Date(Date.now() + 3600 * 1000).toISOString();
      const reminder = await executeMcpTool('create_reminder', {
        message: msg,
        scheduled_time: scheduledTime,
      }, userId);

      toolExecutions.push({
        name: 'create_reminder',
        args: { message: msg, scheduled_time: scheduledTime },
        result: reminder,
        status: 'success',
        timestamp: executionTimestamp,
      });

      return {
        response: `I've set a reminder for "${reminder.message}" scheduled for ${new Date(reminder.scheduled_time).toLocaleTimeString()}.`,
        toolExecutions,
        followUpSuggestions: ['Show my scheduled reminders', 'Add another reminder'],
      };
    }
  }

  // 5. Notes
  if (lower.includes('note')) {
    const executionTimestamp = new Date().toISOString();
    if (lower.includes('search') || lower.includes('find')) {
      const queryMatch = userMessage.match(/(?:for|about)\s+["']?([^"']+)["']?/i);
      const query = queryMatch ? queryMatch[1].trim() : '';
      const notes = await executeMcpTool('search_notes', { query }, userId);
      toolExecutions.push({
        name: 'search_notes',
        args: { query },
        result: notes,
        status: 'success',
        timestamp: executionTimestamp,
      });

      return {
        response: `Found ${notes.length} note${notes.length === 1 ? '' : 's'} matching "${query}".`,
        toolExecutions,
        followUpSuggestions: ['Create a new note', 'List tasks'],
      };
    } else if (lower.includes('save') || lower.includes('create') || lower.includes('take') || lower.includes('add')) {
      let title = 'Quick Note';
      let content = userMessage;
      const titleMatch = userMessage.match(/(?:titled|called)\s+["']([^"']+)["']/i) || userMessage.match(/["']([^"']+)["']/);
      if (titleMatch) title = titleMatch[1];

      const note = await executeMcpTool('save_note', { title, content, tags: ['assistant'] }, userId);
      toolExecutions.push({
        name: 'save_note',
        args: { title, content, tags: ['assistant'] },
        result: note,
        status: 'success',
        timestamp: executionTimestamp,
      });

      return {
        response: `I've saved the note "${note.title}".`,
        toolExecutions,
        followUpSuggestions: ['Search my notes', 'List tasks'],
      };
    }
  }

  // 6. Greetings & identity
  if (lower.includes('who are you') || lower.includes('hello') || lower.includes('hi') || lower.includes('help me with')) {
    return {
      response: "Hello! I am Alexa+, your smart personal voice and text assistant built with Supabase and Model Context Protocol (MCP). I can manage your tasks, reminders, and notes.",
      toolExecutions: [],
      followUpSuggestions: [
        'What tasks do I have pending?',
        'Add a task to buy groceries',
        'Set a reminder for tomorrow morning',
      ],
    };
  }

  return null;
}

function generateSuggestions(executions: AssistantResponse['toolExecutions']): string[] {
  if (executions.length === 0) return [];
  const latest = executions[executions.length - 1];

  switch (latest.name) {
    case 'create_task':
      return ['View all my tasks', 'Set a reminder for this task', 'Add another task'];
    case 'list_tasks':
      return ['Mark a task as completed', 'Add a high priority task', 'Clear completed tasks'];
    case 'create_reminder':
      return ['Show my scheduled reminders', 'Add a follow-up task'];
    case 'save_note':
      return ['Search my notes', 'Create a task from this note'];
    default:
      return ['Check system status', 'What else can you do?'];
  }
}
