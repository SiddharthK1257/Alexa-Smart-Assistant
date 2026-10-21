import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth.js';
import {
  listConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  listMessages,
  addMessage,
} from '../services/conversationService.js';

const router = Router();
router.use(authenticateUser);

const createConvSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

const updateConvSchema = z.object({
  title: z.string().min(1).max(200),
});

const addMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'model', 'system']),
  content: z.string().min(1),
  tool_calls: z.array(z.any()).optional().default([]),
});

// GET /api/conversations — List user conversations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversations = await listConversations(userId);
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations — Create a new conversation
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { title } = createConvSchema.parse(req.body);
    const conversation = await createConversation(userId, title);
    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
});

// GET /api/conversations/:id — Get a conversation and its messages
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id as string;
    const conversation = await getConversation(conversationId, userId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    const messages = await listMessages(conversationId, userId);
    res.json({ conversation, messages });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/conversations/:id — Update conversation title
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id as string;
    const { title } = updateConvSchema.parse(req.body);
    const updated = await updateConversation(conversationId, userId, title);
    if (!updated) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ conversation: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/conversations/:id — Delete conversation
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id as string;
    const deleted = await deleteConversation(conversationId, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ deleted: true, conversationId });
  } catch (err) {
    next(err);
  }
});

// GET /api/conversations/:id/messages — Get messages for conversation
router.get('/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id as string;
    const messages = await listMessages(conversationId, userId);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations/:id/messages — Add a message to conversation
router.post('/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id as string;
    const { role, content, tool_calls } = addMessageSchema.parse(req.body);
    const message = await addMessage(conversationId, userId, role, content, tool_calls);
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
});

export default router;
