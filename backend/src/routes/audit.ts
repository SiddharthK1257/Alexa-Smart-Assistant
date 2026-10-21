import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { query } from '../db/supabase.js';

const router = Router();
router.use(authenticateUser);

// GET /api/audit
router.get('/', async (req, res, next) => {
  try {
    const rawLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 30;

    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [req.user!.id];

    if (req.query.event_type) {
      params.push(req.query.event_type as string);
      conditions.push(`event_type = $${params.length}`);
    }

    if (req.query.status) {
      params.push(req.query.status as string);
      conditions.push(`status = $${params.length}`);
    }

    params.push(limit);

    const result = await query(
      `SELECT id, event_type, tool_name, status, details, ip_address, created_at 
       FROM public.audit_events 
       WHERE ${conditions.join(' AND ')} 
       ORDER BY created_at DESC 
       LIMIT $${params.length}`,
      params
    );

    res.json({ auditEvents: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
