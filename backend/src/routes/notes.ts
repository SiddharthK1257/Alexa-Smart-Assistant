import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import * as noteService from '../services/noteService.js';
import { saveNoteSchema, searchNotesSchema } from '../mcp/tools.js';

const router = Router();
router.use(authenticateUser);

// GET /api/notes
router.get('/', async (req, res, next) => {
  try {
    const rawLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : 20;
    const notes = await noteService.listNotes(req.user!.id, limit);
    res.json({ notes });
  } catch (error) {
    next(error);
  }
});

// GET /api/notes/search
router.get('/search', async (req, res, next) => {
  try {
    const validated = searchNotesSchema.parse(req.query);
    const notes = await noteService.searchNotes(req.user!.id, validated);
    res.json({ notes });
  } catch (error) {
    next(error);
  }
});

// GET /api/notes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const noteId = req.params.id;
    const note = await noteService.getNoteById(req.user!.id, noteId);
    res.json({ note });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('access denied')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
      return;
    }
    next(error);
  }
});

// POST /api/notes
router.post('/', async (req, res, next) => {
  try {
    const validated = saveNoteSchema.parse(req.body);
    const note = await noteService.saveNote(req.user!.id, validated);
    res.status(201).json({ note });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notes/:id and PUT /api/notes/:id
const updateNoteHandler = async (req: any, res: any, next: any) => {
  try {
    const noteId = req.params.id;
    const { title, content, tags } = req.body;
    const updated = await noteService.updateNote(req.user!.id, noteId, { title, content, tags });
    res.json({ note: updated });
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('access denied')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
      return;
    }
    next(error);
  }
};

router.patch('/:id', updateNoteHandler);
router.put('/:id', updateNoteHandler);

// DELETE /api/notes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const noteId = req.params.id;
    const confirm = req.query.confirm === 'true' || req.body?.confirm === true;
    const result = await noteService.deleteNote(req.user!.id, noteId, confirm);
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
