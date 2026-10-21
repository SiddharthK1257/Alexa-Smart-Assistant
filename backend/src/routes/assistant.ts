import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth.js';
import { processAssistantMessage } from '../services/gemini.js';
import { addMessage, createConversation, getConversation } from '../services/conversationService.js';

const router = Router();

const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversationId: z.string().uuid().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .default([]),
});

router.post('/chat', authenticateUser, async (req, res, next) => {
  try {
    const { message, conversationId, history } = chatMessageSchema.parse(req.body);
    const userId = req.user!.id;

    let targetConversationId = conversationId;

    // If conversationId was provided, verify it exists and belongs to the user
    if (targetConversationId) {
      const existingConv = await getConversation(targetConversationId, userId);
      if (!existingConv) {
        targetConversationId = undefined;
      }
    }

    // If still no valid conversationId, create one automatically
    if (!targetConversationId) {
      const autoTitle = message.length > 40 ? `${message.substring(0, 37)}...` : message;
      const newConv = await createConversation(userId, autoTitle);
      targetConversationId = newConv.id;
    }

    // Persist user message to database
    await addMessage(targetConversationId, userId, 'user', message, []);

    // Process with Gemini AI / Fallback Intent Router
    const result = await processAssistantMessage(message, history, userId);

    // Persist assistant response and tool execution metadata to database
    await addMessage(
      targetConversationId,
      userId,
      'assistant',
      result.response,
      result.toolExecutions || []
    );

    res.json({
      ...result,
      conversationId: targetConversationId,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
