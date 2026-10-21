import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth.js';
import * as taskService from '../services/taskService.js';
import { createTaskSchema, updateTaskSchema } from '../mcp/tools.js';

const router = Router();

// Require user authentication for all task routes
router.use(authenticateUser);

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, limit } = req.query;
    const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;
    const tasks = await taskService.listTasks(req.user!.id, {
      status: status as string,
      priority: priority as string,
      limit: Number.isInteger(parsedLimit) ? parsedLimit : undefined,
    });
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await taskService.getTaskById(req.user!.id, taskId);
    res.json({ task });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('access denied')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
      return;
    }
    next(error);
  }
});

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const validated = createTaskSchema.parse(req.body);
    const task = await taskService.createTask(req.user!.id, validated);
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id and PUT /api/tasks/:id
const updateTaskHandler = async (req: any, res: any, next: any) => {
  try {
    const taskId = req.params.id;
    const validated = updateTaskSchema.omit({ task_id: true }).parse(req.body);
    const updated = await taskService.updateTask(req.user!.id, taskId, validated);
    res.json({ task: updated });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('access denied')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
      return;
    }
    next(error);
  }
};

router.patch('/:id', updateTaskHandler);
router.put('/:id', updateTaskHandler);

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const confirm = req.query.confirm === 'true' || req.body?.confirm === true;
    const result = await taskService.deleteTask(req.user!.id, taskId, confirm);
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
