import { z } from 'zod';
import * as taskService from '../services/taskService.js';
import * as reminderService from '../services/reminderService.js';
import * as noteService from '../services/noteService.js';
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

// Tool definitions catalog
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
        // Get user counts
        const [taskCounts, reminderCounts, noteCounts] = await Promise.all([
          query('SELECT status, count(*) FROM public.tasks WHERE user_id = $1 GROUP BY status', [userId]),
          query('SELECT status, count(*) FROM public.reminders WHERE user_id = $1 GROUP BY status', [userId]),
          query('SELECT count(*) FROM public.notes WHERE user_id = $1', [userId]),
        ]);

        result = {
          assistant: 'Alexa+ Smart Assistant (Supabase Edition)',
          status: 'healthy',
          version: '1.0.0',
          mcpProtocolVersion: '2025-11-25',
          timestamp: new Date().toISOString(),
          uptimeSeconds: Math.floor(process.uptime()),
          userSummary: {
            tasksByStatus: Object.fromEntries(taskCounts.rows.map(r => [r.status, parseInt(r.count, 10)])),
            remindersByStatus: Object.fromEntries(reminderCounts.rows.map(r => [r.status, parseInt(r.count, 10)])),
            totalNotes: parseInt(noteCounts.rows[0]?.count || '0', 10),
          },
          database: 'connected (Supabase PostgreSQL)',
        };
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
