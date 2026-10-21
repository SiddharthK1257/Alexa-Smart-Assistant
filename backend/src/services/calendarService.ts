import { query } from '../db/supabase.js';

export interface CalendarEvent {
  id: string;
  user_id: string;
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
  created_at: string;
  updated_at: string;
}

export async function getCalendarEvents(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> {
  let sql = `SELECT * FROM public.calendar_events WHERE user_id = $1`;
  const params: any[] = [userId];

  if (startDate) {
    params.push(startDate);
    sql += ` AND end_time >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    sql += ` AND start_time <= $${params.length}`;
  }

  sql += ` ORDER BY start_time ASC`;

  const res = await query<CalendarEvent>(sql, params);
  return res.rows;
}

export async function addCalendarEvent(
  userId: string,
  event: {
    title: string;
    event_type: 'hotel' | 'restaurant' | 'reminder' | 'personal';
    start_time: string;
    end_time: string;
    location?: string;
    description?: string;
    image_url?: string;
    reference_id?: string;
    metadata?: Record<string, any>;
  }
): Promise<CalendarEvent> {
  const res = await query<CalendarEvent>(
    `INSERT INTO public.calendar_events (
       user_id, title, event_type, start_time, end_time, location, description, image_url, reference_id, metadata
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      userId,
      event.title,
      event.event_type,
      event.start_time,
      event.end_time,
      event.location || null,
      event.description || null,
      event.image_url || null,
      event.reference_id || null,
      JSON.stringify(event.metadata || {}),
    ]
  );
  return res.rows[0];
}

export async function deleteCalendarEvent(userId: string, eventId: string): Promise<boolean> {
  const res = await query(
    `DELETE FROM public.calendar_events WHERE id = $1 AND user_id = $2 RETURNING id`,
    [eventId, userId]
  );
  return (res.rowCount ?? 0) > 0;
}
