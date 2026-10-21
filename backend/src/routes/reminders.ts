import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import * as reminderService from '../services/reminderService.js';
import { createReminderSchema } from '../mcp/tools.js';

const router = Router();
router.use(authenticateUser);

// GET /api/reminders
router.get('/', async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;
    const reminders = await reminderService.listReminders(req.user!.id, {
      status: status as string,
      limit: Number.isInteger(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ reminders });
  } catch (error) {
    next(error);
  }
});

// GET /api/reminders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const reminderId = req.params.id;
    const reminder = await reminderService.getReminderById(req.user!.id, reminderId);
    res.json({ reminder });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('access denied')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
      return;
    }
    next(error);
  }
});

// POST /api/reminders
router.post('/', async (req, res, next) => {
  try {
    const validated = createReminderSchema.parse(req.body);
    const reminder = await reminderService.createReminder(req.user!.id, validated);
    res.status(201).json({ reminder });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/reminders/:id and PUT /api/reminders/:id
const updateReminderHandler = async (req: any, res: any, next: any) => {
  try {
    const reminderId = req.params.id;
    const updated = await reminderService.updateReminder(req.user!.id, reminderId, req.body);
    res.json({ reminder: updated });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('access denied')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
      return;
    }
    next(error);
  }
};

router.patch('/:id', updateReminderHandler);
router.put('/:id', updateReminderHandler);

// DELETE /api/reminders/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const reminderId = req.params.id;
    const confirm = req.query.confirm === 'true' || req.body?.confirm === true;
    const result = await reminderService.deleteReminder(req.user!.id, reminderId, confirm);
    res.json(result);
  } catch (error: any) {
    if (error.message?.includes('Confirmation required')) {
      res.status(400).json({ error: 'Bad Request', message: error.message });
      return;
    }
    if (error.message?.includes('not found') || error.message?.includes('access denied')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
      return;
    }
    next(error);
  }
});

export default router;
