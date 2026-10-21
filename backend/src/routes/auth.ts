import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../db/supabase.js';
import { logAuditEvent } from '../db/audit.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(1).max(100).optional(),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// POST /api/auth/register — Direct, reliable account registration bypassing Supabase SMTP rate limits
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = registerSchema.parse(req.body);
    const cleanName = displayName?.trim() || email.split('@')[0];

    // Check if user already exists
    const existing = await query('SELECT id FROM auth.users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(400).json({
        error: 'User already exists',
        message: 'An account with this email already exists. Please sign in instead.',
      });
      return;
    }

    // Generate new UUID
    const idRes = await query('SELECT gen_random_uuid() as id');
    const newUserId: string = idRes.rows[0].id;

    const userMetadata = JSON.stringify({
      sub: newUserId,
      email,
      full_name: cleanName,
      display_name: cleanName,
      email_verified: true,
      phone_verified: false,
    });

    const identityData = JSON.stringify({
      sub: newUserId,
      email,
    });

    // 1. Insert into auth.users (with email pre-confirmed)
    await query(`
      INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        raw_app_meta_data,
        raw_user_meta_data,
        is_sso_user,
        is_anonymous,
        created_at,
        updated_at
      ) VALUES (
        $1::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        $2::varchar,
        crypt($3, gen_salt('bf', 10)),
        NOW(),
        '',
        '',
        '',
        '',
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        $4::jsonb,
        false,
        false,
        NOW(),
        NOW()
      );
    `, [newUserId, email, password, userMetadata]);

    // 2. Insert into auth.identities
    await query(`
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        $1::uuid,
        $1::uuid,
        $2::jsonb,
        'email',
        $1::text,
        NOW(),
        NOW(),
        NOW()
      ) ON CONFLICT (provider, provider_id) DO NOTHING;
    `, [newUserId, identityData]);

    // 3. Insert into public.profiles
    await query(`
      INSERT INTO public.profiles (id, email, display_name, preferences)
      VALUES (
        $1::uuid,
        $2::text,
        $3::text,
        '{"voice_muted": false, "speech_rate": 1.0, "theme": "alexa_dark"}'::jsonb
      )
      ON CONFLICT (id) DO UPDATE
      SET display_name = EXCLUDED.display_name,
          email = EXCLUDED.email;
    `, [newUserId, email, cleanName]);

    await logAuditEvent({
      userId: newUserId,
      eventType: 'user_registered',
      status: 'success',
      details: { email, source: 'backend_registration' },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Account created and verified successfully.',
      user: {
        id: newUserId,
        email,
        display_name: cleanName,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password — Set new password directly bypassing broken SMTP rate limit
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, newPassword } = resetPasswordSchema.parse(req.body);

    const userRes = await query('SELECT id FROM auth.users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      res.status(404).json({
        error: 'User not found',
        message: 'No account registered with this email address.',
      });
      return;
    }

    const userId = userRes.rows[0].id;

    // Update password in auth.users
    await query(`
      UPDATE auth.users
      SET encrypted_password = crypt($1, gen_salt('bf', 10)),
          email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
          updated_at = NOW()
      WHERE id = $2::uuid;
    `, [newPassword, userId]);

    await logAuditEvent({
      userId,
      eventType: 'password_reset',
      status: 'success',
      details: { email, source: 'backend_password_reset' },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Password updated successfully. You can now sign in with your new password.',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/lookup?email=... — Check if user email is registered
router.get('/lookup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = String(req.query.email || '').toLowerCase().trim();
    if (!email) {
      res.status(400).json({ error: 'Email parameter required' });
      return;
    }

    const userRes = await query('SELECT id, email FROM auth.users WHERE email = $1', [email]);
    res.json({
      exists: userRes.rows.length > 0,
      email,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
