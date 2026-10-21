import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { query } from '../db/supabase.js';

const router = Router();
router.use(authenticateUser);

// GET /api/profile
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, display_name, email, avatar_url, preferences, created_at, updated_at
       FROM public.profiles
       WHERE id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      // Profile doesn't exist yet, return basic user data
      res.json({
        profile: {
          id: req.user!.id,
          display_name: 'Alexa+ User',
          email: req.user!.email || null,
          preferences: { voice_muted: false, speech_rate: 1.0, theme: 'alexa_dark' },
        },
      });
      return;
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/profile and PUT /api/profile
const updateProfileHandler = async (req: any, res: any, next: any) => {
  try {
    const { display_name, avatar_url, preferences } = req.body;
    const fields: string[] = [];
    const params: any[] = [req.user!.id];

    if (display_name !== undefined) {
      params.push(display_name.trim());
      fields.push(`display_name = $${params.length}`);
    }

    if (avatar_url !== undefined) {
      params.push(avatar_url);
      fields.push(`avatar_url = $${params.length}`);
    }

    if (preferences !== undefined) {
      params.push(JSON.stringify(preferences));
      fields.push(`preferences = $${params.length}`);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No valid fields provided for profile update' });
      return;
    }

    const sql = `
      UPDATE public.profiles
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, params);
    res.json({ profile: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

router.patch('/', updateProfileHandler);
router.put('/', updateProfileHandler);

export default router;
