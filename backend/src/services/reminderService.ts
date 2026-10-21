import { query } from '../db/supabase.js';
import { logAuditEvent } from '../db/audit.js';

export interface Reminder {
  id: string;
  user_id: string;
  message: string;
  scheduled_time: string;
  status: 'scheduled' | 'fired' | 'dismissed' | 'cancelled';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateReminderInput {
  message: string;
  scheduled_time: string;
  metadata?: Record<string, any>;
}

export interface ListRemindersFilter {
  status?: string;
  limit?: number;
}

export interface UpdateReminderInput {
  message?: string;
  scheduled_time?: string;
  status?: 'scheduled' | 'fired' | 'dismissed' | 'cancelled';
}

export async function createReminder(userId: string, input: CreateReminderInput): Promise<Reminder> {
  if (!input.message || input.message.trim().length === 0) {
    throw new Error('Reminder message cannot be empty');
  }

  // Validate date
  const dateObj = new Date(input.scheduled_time);
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid scheduled_time: "${input.scheduled_time}". Must be valid ISO 8601 string.`);
  }

  const metadata = input.metadata || {};

  const res = await query<Reminder>(
    `INSERT INTO public.reminders (user_id, message, scheduled_time, metadata)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      userId,
      input.message.trim(),
      dateObj.toISOString(),
      JSON.stringify(metadata),
    ]
  );

  const created = res.rows[0];

  await logAuditEvent({
    userId,
    eventType: 'reminder_created',
    toolName: 'create_reminder',
    status: 'success',
    details: { reminderId: created.id, message: created.message, scheduled_time: created.scheduled_time },
  });

  return created;
}

export async function listReminders(userId: string, filter: ListRemindersFilter = {}): Promise<Reminder[]> {
  const conditions: string[] = ['user_id = $1'];
  const params: any[] = [userId];

  if (filter.status && filter.status !== 'all') {
    params.push(filter.status);
    conditions.push(`status = $${params.length}`);
  }

  const limit = Math.min(Math.max(Number.isInteger(filter.limit) && (filter.limit as number) > 0 ? (filter.limit as number) : 20, 1), 100);
  params.push(limit);

  const res = await query<Reminder>(
    `SELECT * FROM public.reminders 
     WHERE ${conditions.join(' AND ')} 
     ORDER BY scheduled_time ASC 
     LIMIT $${params.length}`,
    params
  );

  return res.rows;
}

export async function getReminderById(userId: string, reminderId: string): Promise<Reminder> {
  const res = await query<Reminder>(
    `SELECT * FROM public.reminders WHERE user_id = $1 AND id = $2`,
    [userId, reminderId]
  );
  if (res.rows.length === 0) {
    throw new Error(`Reminder not found or access denied (ID: ${reminderId})`);
  }
  return res.rows[0];
}

export async function updateReminder(userId: string, reminderId: string, updates: UpdateReminderInput): Promise<Reminder> {
  const fields: string[] = [];
  const params: any[] = [userId, reminderId];

  if (updates.message !== undefined) {
    if (!updates.message.trim()) throw new Error('Reminder message cannot be empty');
    params.push(updates.message.trim());
    fields.push(`message = $${params.length}`);
  }

  if (updates.scheduled_time !== undefined) {
    const d = new Date(updates.scheduled_time);
    if (isNaN(d.getTime())) throw new Error('Invalid scheduled_time format');
    params.push(d.toISOString());
    fields.push(`scheduled_time = $${params.length}`);
  }

  if (updates.status !== undefined) {
    params.push(updates.status);
    fields.push(`status = $${params.length}`);
  }

  if (fields.length === 0) {
    throw new Error('No valid fields provided for reminder update');
  }

  const sql = `
    UPDATE public.reminders 
    SET ${fields.join(', ')} 
    WHERE user_id = $1 AND id = $2 
    RETURNING *
  `;

  const res = await query<Reminder>(sql, params);

  if (res.rows.length === 0) {
    throw new Error(`Reminder not found or access denied (ID: ${reminderId})`);
  }

  const updated = res.rows[0];

  await logAuditEvent({
    userId,
    eventType: 'reminder_updated',
    status: 'success',
    details: { reminderId: updated.id, status: updated.status },
  });

  return updated;
}

export async function deleteReminder(userId: string, reminderId: string, confirm: boolean): Promise<{ deleted: boolean; reminderId: string }> {
  if (!confirm) {
    throw new Error('Confirmation required: Destructive action "delete_reminder" must have confirm=true');
  }

  const res = await query(
    `DELETE FROM public.reminders WHERE user_id = $1 AND id = $2 RETURNING id, message`,
    [userId, reminderId]
  );

  if (res.rows.length === 0) {
    throw new Error(`Reminder not found or access denied (ID: ${reminderId})`);
  }

  await logAuditEvent({
    userId,
    eventType: 'reminder_deleted',
    status: 'success',
    details: { reminderId, message: res.rows[0].message },
  });

  return { deleted: true, reminderId };
}
