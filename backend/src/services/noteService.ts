import { query } from '../db/supabase.js';
import { logAuditEvent } from '../db/audit.js';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SaveNoteInput {
  title: string;
  content: string;
  tags?: string[];
}

export interface SearchNotesFilter {
  query?: string;
  tag?: string;
  limit?: number;
}

export async function saveNote(userId: string, input: SaveNoteInput): Promise<Note> {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error('Note title cannot be empty');
  }

  const tags = input.tags || [];

  const res = await query<Note>(
    `INSERT INTO public.notes (user_id, title, content, tags)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      userId,
      input.title.trim(),
      input.content ? input.content.trim() : '',
      tags,
    ]
  );

  const created = res.rows[0];

  await logAuditEvent({
    userId,
    eventType: 'note_saved',
    toolName: 'save_note',
    status: 'success',
    details: { noteId: created.id, title: created.title, tagCount: created.tags.length },
  });

  return created;
}

export async function searchNotes(userId: string, filter: SearchNotesFilter = {}): Promise<Note[]> {
  const conditions: string[] = ['user_id = $1'];
  const params: any[] = [userId];

  if (filter.query && filter.query.trim().length > 0) {
    params.push(`%${filter.query.trim()}%`);
    conditions.push(`(title ILIKE $${params.length} OR content ILIKE $${params.length})`);
  }

  if (filter.tag && filter.tag.trim().length > 0) {
    params.push(filter.tag.trim());
    conditions.push(`$${params.length} = ANY(tags)`);
  }

  const limit = Math.min(Math.max(Number.isInteger(filter.limit) && (filter.limit as number) > 0 ? (filter.limit as number) : 10, 1), 50);
  params.push(limit);

  const res = await query<Note>(
    `SELECT * FROM public.notes 
     WHERE ${conditions.join(' AND ')} 
     ORDER BY updated_at DESC 
     LIMIT $${params.length}`,
    params
  );

  return res.rows;
}

export async function listNotes(userId: string, limit = 20): Promise<Note[]> {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 20;
  const boundedLimit = Math.min(Math.max(safeLimit, 1), 100);
  const res = await query<Note>(
    `SELECT * FROM public.notes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2`,
    [userId, boundedLimit]
  );
  return res.rows;
}

export async function getNoteById(userId: string, noteId: string): Promise<Note> {
  const res = await query<Note>(
    `SELECT * FROM public.notes WHERE user_id = $1 AND id = $2`,
    [userId, noteId]
  );
  if (res.rows.length === 0) {
    throw new Error(`Note not found or access denied (ID: ${noteId})`);
  }
  return res.rows[0];
}

export async function updateNote(
  userId: string,
  noteId: string,
  updates: { title?: string; content?: string; tags?: string[] }
): Promise<Note> {
  const fields: string[] = [];
  const params: any[] = [userId, noteId];

  if (updates.title !== undefined) {
    if (!updates.title.trim()) throw new Error('Note title cannot be empty');
    params.push(updates.title.trim());
    fields.push(`title = $${params.length}`);
  }

  if (updates.content !== undefined) {
    params.push(updates.content.trim());
    fields.push(`content = $${params.length}`);
  }

  if (updates.tags !== undefined) {
    params.push(updates.tags);
    fields.push(`tags = $${params.length}`);
  }

  if (fields.length === 0) {
    throw new Error('No valid fields provided for note update');
  }

  const sql = `
    UPDATE public.notes 
    SET ${fields.join(', ')} 
    WHERE user_id = $1 AND id = $2 
    RETURNING *
  `;

  const res = await query<Note>(sql, params);

  if (res.rows.length === 0) {
    throw new Error(`Note not found or access denied (ID: ${noteId})`);
  }

  const updated = res.rows[0];

  await logAuditEvent({
    userId,
    eventType: 'note_updated',
    status: 'success',
    details: { noteId: updated.id, title: updated.title },
  });

  return updated;
}

export async function deleteNote(userId: string, noteId: string, confirm: boolean): Promise<{ deleted: boolean; noteId: string }> {
  if (!confirm) {
    throw new Error('Confirmation required: Destructive action "delete_note" must have confirm=true');
  }

  const res = await query(
    `DELETE FROM public.notes WHERE user_id = $1 AND id = $2 RETURNING id, title`,
    [userId, noteId]
  );

  if (res.rows.length === 0) {
    throw new Error(`Note not found or access denied (ID: ${noteId})`);
  }

  await logAuditEvent({
    userId,
    eventType: 'note_deleted',
    status: 'success',
    details: { noteId, title: res.rows[0].title },
  });

  return { deleted: true, noteId };
}
