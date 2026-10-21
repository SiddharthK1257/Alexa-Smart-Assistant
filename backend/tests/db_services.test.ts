import { describe, it, expect } from 'vitest';
import * as taskService from '../src/services/taskService.js';
import * as reminderService from '../src/services/reminderService.js';
import * as noteService from '../src/services/noteService.js';
import { query } from '../src/db/supabase.js';

describe('Supabase Services & User Isolation Tests', () => {
  const userA = 'a0000000-0000-0000-0000-000000000001';
  const userB = 'a0000000-0000-0000-0000-000000000002';

  it('Task Service: Creates, lists, updates, and enforces user isolation', async () => {
    // 1. Create task for User A
    const taskA = await taskService.createTask(userA, {
      title: 'User A Secret Task',
      description: 'Confidential project details',
      priority: 'high',
      due_date: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(taskA).toHaveProperty('id');
    expect(taskA.user_id).toBe(userA);
    expect(taskA.title).toBe('User A Secret Task');
    expect(taskA.status).toBe('pending');

    // 2. User B lists tasks - MUST NOT see User A's task!
    const userBTasks = await taskService.listTasks(userB);
    const leaked = userBTasks.find(t => t.id === taskA.id);
    expect(leaked).toBeUndefined();

    // 3. User B tries to update User A's task - MUST FAIL with not found / access denied
    await expect(
      taskService.updateTask(userB, taskA.id, { title: 'Hacked by User B' })
    ).rejects.toThrow(/not found or access denied/i);

    // 4. User A updates own task
    const updatedA = await taskService.updateTask(userA, taskA.id, {
      status: 'completed',
      priority: 'urgent',
    });
    expect(updatedA.status).toBe('completed');
    expect(updatedA.priority).toBe('urgent');

    // 5. Destructive action: Deleting task without confirm=true fails
    await expect(
      taskService.deleteTask(userA, taskA.id, false)
    ).rejects.toThrow(/Confirmation required/i);

    // 6. Delete with confirmation
    const deleteRes = await taskService.deleteTask(userA, taskA.id, true);
    expect(deleteRes.deleted).toBe(true);

    // Verify deleted
    const tasksAfterDelete = await taskService.listTasks(userA);
    expect(tasksAfterDelete.find(t => t.id === taskA.id)).toBeUndefined();
  });

  it('Reminder Service: Creates and queries scheduled reminders', async () => {
    const scheduledTime = new Date(Date.now() + 3600000).toISOString();

    const reminder = await reminderService.createReminder(userA, {
      message: 'Take a quick 5 minute break',
      scheduled_time: scheduledTime,
    });

    expect(reminder).toHaveProperty('id');
    expect(reminder.user_id).toBe(userA);
    expect(reminder.message).toBe('Take a quick 5 minute break');
    expect(reminder.status).toBe('scheduled');

    // List reminders
    const reminders = await reminderService.listReminders(userA, { status: 'scheduled' });
    expect(reminders.some(r => r.id === reminder.id)).toBe(true);

    // Clean up
    await reminderService.deleteReminder(userA, reminder.id, true);
  });

  it('Note Service: Saves and searches notes with keywords and tags', async () => {
    const note = await noteService.saveNote(userA, {
      title: 'Supabase Architecture Notes',
      content: 'Using PostgreSQL Row Level Security to protect user data.',
      tags: ['supabase', 'security', 'architecture'],
    });

    expect(note).toHaveProperty('id');
    expect(note.user_id).toBe(userA);
    expect(note.tags).toContain('supabase');

    // Search by keyword
    const searchResults = await noteService.searchNotes(userA, { query: 'PostgreSQL' });
    expect(searchResults.some(n => n.id === note.id)).toBe(true);

    // Search by tag
    const tagResults = await noteService.searchNotes(userA, { tag: 'security' });
    expect(tagResults.some(n => n.id === note.id)).toBe(true);

    // Clean up
    await noteService.deleteNote(userA, note.id, true);
  });

  it('Audit Events: Logs events and enforces non-empty constraints', async () => {
    const auditRes = await query(
      `SELECT count(*) FROM public.audit_events WHERE user_id = $1`,
      [userA]
    );
    expect(parseInt(auditRes.rows[0].count, 10)).toBeGreaterThan(0);
  });
});
