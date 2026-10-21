import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { config } from '../config.js';
import { executeMcpTool } from './tools.js';

export function createUserMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: config.MCP_SERVER_NAME,
    version: config.MCP_SERVER_VERSION,
  });

  // 1. create_task
  server.tool(
    'create_task',
    'Create a new personal task with title, priority, due date, and optional description.',
    {
      title: z.string().min(1).describe('The title of the task'),
      description: z.string().optional().describe('Optional detailed notes or description of the task'),
      due_date: z.string().optional().describe('Optional due date in ISO 8601 format'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium').optional().describe('Task priority level'),
    },
    async (args) => {
      try {
        const result = await executeMcpTool('create_task', args, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, task: result }, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error creating task: ${err.message}` }],
        };
      }
    }
  );

  // 2. list_tasks
  server.tool(
    'list_tasks',
    'List personal tasks filtered by status or priority.',
    {
      status: z.enum(['all', 'pending', 'in_progress', 'completed', 'cancelled']).default('all').optional().describe('Filter by task status'),
      priority: z.enum(['all', 'low', 'medium', 'high', 'urgent']).default('all').optional().describe('Filter by priority'),
      limit: z.number().int().min(1).max(50).default(20).optional().describe('Maximum number of tasks to return'),
    },
    async (args) => {
      try {
        const result = await executeMcpTool('list_tasks', args, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, count: result.length, tasks: result }, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error listing tasks: ${err.message}` }],
        };
      }
    }
  );

  // 3. update_task
  server.tool(
    'update_task',
    'Update an existing task status, priority, title, or due date by task UUID.',
    {
      task_id: z.string().uuid().describe('The UUID of the task to update'),
      title: z.string().min(1).optional().describe('Updated task title'),
      description: z.string().optional().describe('Updated description'),
      due_date: z.string().optional().describe('Updated due date ISO string'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Updated priority'),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional().describe('Updated task status'),
    },
    async (args) => {
      try {
        const result = await executeMcpTool('update_task', args, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, task: result }, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error updating task: ${err.message}` }],
        };
      }
    }
  );

  // 4. create_reminder
  server.tool(
    'create_reminder',
    'Schedule a reminder message with an ISO 8601 scheduled timestamp.',
    {
      message: z.string().min(1).describe('The reminder message or alert'),
      scheduled_time: z.string().describe('Target timestamp in ISO 8601 format (e.g. 2026-10-21T16:00:00Z)'),
    },
    async (args) => {
      try {
        const result = await executeMcpTool('create_reminder', args, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, reminder: result }, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error creating reminder: ${err.message}` }],
        };
      }
    }
  );

  // 5. list_reminders
  server.tool(
    'list_reminders',
    'List scheduled or active reminders for the authenticated user.',
    {
      status: z.enum(['all', 'scheduled', 'fired', 'dismissed', 'cancelled']).default('scheduled').optional().describe('Filter by reminder status'),
      limit: z.number().int().min(1).max(50).default(20).optional().describe('Maximum number of reminders to return'),
    },
    async (args) => {
      try {
        const result = await executeMcpTool('list_reminders', args, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, count: result.length, reminders: result }, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error listing reminders: ${err.message}` }],
        };
      }
    }
  );

  // 6. save_note
  server.tool(
    'save_note',
    'Save or store a personal note with markdown content and tags.',
    {
      title: z.string().min(1).describe('Title of the note'),
      content: z.string().describe('Full markdown or text content of the note'),
      tags: z.array(z.string()).default([]).optional().describe('List of tags or categories'),
    },
    async (args) => {
      try {
        const result = await executeMcpTool('save_note', args, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, note: result }, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error saving note: ${err.message}` }],
        };
      }
    }
  );

  // 7. search_notes
  server.tool(
    'search_notes',
    'Search stored personal notes by keywords or filter by tag.',
    {
      query: z.string().optional().describe('Search query keyword matching note title or body'),
      tag: z.string().optional().describe('Filter by specific tag'),
      limit: z.number().int().min(1).max(50).default(10).optional().describe('Maximum notes to return'),
    },
    async (args) => {
      try {
        const result = await executeMcpTool('search_notes', args, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, count: result.length, notes: result }, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error searching notes: ${err.message}` }],
        };
      }
    }
  );

  // 8. get_assistant_status
  server.tool(
    'get_assistant_status',
    'Get operational metrics, database connection health, task and reminder statistics.',
    {},
    async (args) => {
      try {
        const result = await executeMcpTool('get_assistant_status', args, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching assistant status: ${err.message}` }],
        };
      }
    }
  );

  return server;
}
