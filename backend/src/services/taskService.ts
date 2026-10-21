import { query } from '../db/supabase.js';
import { logAuditEvent } from '../db/audit.js';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface ListTasksFilter {
  status?: string;
  priority?: string;
  limit?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error('Task title cannot be empty');
  }

  const priority = input.priority || 'medium';
  const metadata = input.metadata || {};

  const res = await query<Task>(
    `INSERT INTO public.tasks (user_id, title, description, due_date, priority, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      userId,
      input.title.trim(),
      input.description ? input.description.trim() : null,
      input.due_date || null,
      priority,
      JSON.stringify(metadata),
    ]
  );

  const created = res.rows[0];

  await logAuditEvent({
    userId,
    eventType: 'task_created',
    toolName: 'create_task',
    status: 'success',
    details: { taskId: created.id, title: created.title, priority: created.priority },
  });

  return created;
}

export async function listTasks(userId: string, filter: ListTasksFilter = {}): Promise<Task[]> {
  const conditions: string[] = ['user_id = $1'];
  const params: any[] = [userId];

  if (filter.status && filter.status !== 'all') {
    params.push(filter.status);
    conditions.push(`status = $${params.length}`);
  }

  if (filter.priority && filter.priority !== 'all') {
    params.push(filter.priority);
    conditions.push(`priority = $${params.length}`);
  }

  const limit = Math.min(Math.max(Number.isInteger(filter.limit) && (filter.limit as number) > 0 ? (filter.limit as number) : 20, 1), 100);
  params.push(limit);

  const res = await query<Task>(
    `SELECT * FROM public.tasks 
     WHERE ${conditions.join(' AND ')} 
     ORDER BY created_at DESC 
     LIMIT $${params.length}`,
    params
  );

  return res.rows;
}

export async function getTaskById(userId: string, taskId: string): Promise<Task> {
  const res = await query<Task>(
    `SELECT * FROM public.tasks WHERE user_id = $1 AND id = $2`,
    [userId, taskId]
  );
  if (res.rows.length === 0) {
    throw new Error(`Task not found or access denied (ID: ${taskId})`);
  }
  return res.rows[0];
}

export async function updateTask(userId: string, taskId: string, updates: UpdateTaskInput): Promise<Task> {
  const fields: string[] = [];
  const params: any[] = [userId, taskId];

  if (updates.title !== undefined) {
    if (!updates.title.trim()) throw new Error('Task title cannot be empty');
    params.push(updates.title.trim());
    fields.push(`title = $${params.length}`);
  }

  if (updates.description !== undefined) {
    params.push(updates.description ? updates.description.trim() : null);
    fields.push(`description = $${params.length}`);
  }

  if (updates.due_date !== undefined) {
    params.push(updates.due_date || null);
    fields.push(`due_date = $${params.length}`);
  }

  if (updates.priority !== undefined) {
    params.push(updates.priority);
    fields.push(`priority = $${params.length}`);
  }

  if (updates.status !== undefined) {
    params.push(updates.status);
    fields.push(`status = $${params.length}`);
  }

  if (fields.length === 0) {
    throw new Error('No valid fields provided for task update');
  }

  const sql = `
    UPDATE public.tasks 
    SET ${fields.join(', ')} 
    WHERE user_id = $1 AND id = $2 
    RETURNING *
  `;

  const res = await query<Task>(sql, params);

  if (res.rows.length === 0) {
    throw new Error(`Task not found or access denied (ID: ${taskId})`);
  }

  const updated = res.rows[0];

  await logAuditEvent({
    userId,
    eventType: 'task_updated',
    toolName: 'update_task',
    status: 'success',
    details: { taskId: updated.id, status: updated.status, priority: updated.priority },
  });

  return updated;
}

export async function deleteTask(userId: string, taskId: string, confirm: boolean): Promise<{ deleted: boolean; taskId: string }> {
  if (!confirm) {
    throw new Error('Confirmation required: Destructive action "delete_task" must have confirm=true');
  }

  const res = await query(
    `DELETE FROM public.tasks WHERE user_id = $1 AND id = $2 RETURNING id, title`,
    [userId, taskId]
  );

  if (res.rows.length === 0) {
    throw new Error(`Task not found or access denied (ID: ${taskId})`);
  }

  await logAuditEvent({
    userId,
    eventType: 'task_deleted',
    status: 'success',
    details: { taskId, title: res.rows[0].title },
  });

  return { deleted: true, taskId };
}
