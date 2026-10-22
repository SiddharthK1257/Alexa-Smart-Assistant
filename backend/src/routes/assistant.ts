import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../middleware/auth.js';
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
  userLocation: z
    .object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

// Default verified demo user ID for guest/unauthenticated prompts
const DEFAULT_DEMO_USER_ID = 'a0000000-0000-0000-0000-000000000001';

router.post('/chat', optionalAuth, async (req, res, next) => {
  try {
    const { message, conversationId, history, userLocation } = chatMessageSchema.parse(req.body);
    const userId = req.user?.id || DEFAULT_DEMO_USER_ID;

    let targetConversationId = conversationId;

    // If conversationId was provided, verify it exists and belongs to the user
    if (targetConversationId) {
      try {
        const existingConv = await getConversation(targetConversationId, userId);
        if (!existingConv) {
          targetConversationId = undefined;
        }
      } catch (dbErr) {
        console.warn('DB conversation lookup warning (non-fatal):', dbErr);
      }
    }

    // If still no valid conversationId, create one automatically
    if (!targetConversationId) {
      try {
        const autoTitle = message.length > 40 ? `${message.substring(0, 37)}...` : message;
        const newConv = await createConversation(userId, autoTitle);
        targetConversationId = newConv?.id;
      } catch (dbErr) {
        console.warn('DB create conversation warning (non-fatal):', dbErr);
      }
    }

    // Persist user message to database if target conversation is available
    if (targetConversationId) {
      try {
        await addMessage(targetConversationId, userId, 'user', message, []);
      } catch (dbErr) {
        console.warn('DB persist user message warning (non-fatal):', dbErr);
      }
    }

    // Process with Gemini AI / Fallback Intent Router
    const result = await processAssistantMessage(message, history, userId, userLocation);

    // Persist assistant response and tool execution metadata to database
    if (targetConversationId) {
      try {
        await addMessage(
          targetConversationId,
          userId,
          'assistant',
          result.response,
          result.toolExecutions || []
        );
      } catch (dbErr) {
        console.warn('DB persist assistant message warning (non-fatal):', dbErr);
      }
    }

    res.json({
      ...result,
      conversationId: targetConversationId,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
