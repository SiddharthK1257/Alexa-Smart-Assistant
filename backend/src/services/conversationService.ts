import { query } from '../db/supabase.js';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
  tool_calls: any[];
  created_at: string;
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const result = await query<Conversation>(
    `SELECT * FROM public.conversations 
     WHERE user_id = $1 
     ORDER BY updated_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
  const result = await query<Conversation>(
    `SELECT * FROM public.conversations 
     WHERE id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
  return result.rows[0] || null;
}

export async function createConversation(userId: string, title = 'New Conversation'): Promise<Conversation> {
  const result = await query<Conversation>(
    `INSERT INTO public.conversations (user_id, title)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, title]
  );
  return result.rows[0];
}

export async function updateConversation(
  conversationId: string,
  userId: string,
  title: string
): Promise<Conversation | null> {
  const result = await query<Conversation>(
    `UPDATE public.conversations 
     SET title = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [title, conversationId, userId]
  );
  return result.rows[0] || null;
}

export async function deleteConversation(conversationId: string, userId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM public.conversations 
     WHERE id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listMessages(conversationId: string, userId: string): Promise<Message[]> {
  // Ensure user owns conversation
  const conv = await getConversation(conversationId, userId);
  if (!conv) {
    throw new Error('Conversation not found or unauthorized');
  }

  const result = await query<Message>(
    `SELECT * FROM public.messages 
     WHERE conversation_id = $1 AND user_id = $2
     ORDER BY created_at ASC`,
    [conversationId, userId]
  );
  return result.rows;
}

export async function addMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant' | 'model' | 'system',
  content: string,
  toolCalls: any[] = []
): Promise<Message> {
  // Ensure user owns conversation
  const conv = await getConversation(conversationId, userId);
  if (!conv) {
    throw new Error('Conversation not found or unauthorized');
  }

  const result = await query<Message>(
    `INSERT INTO public.messages (conversation_id, user_id, role, content, tool_calls)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING *`,
    [conversationId, userId, role, content, JSON.stringify(toolCalls)]
  );

  // Update conversation updated_at
  await query(
    `UPDATE public.conversations 
     SET updated_at = NOW() 
     WHERE id = $1`,
    [conversationId]
  );

  return result.rows[0];
}
