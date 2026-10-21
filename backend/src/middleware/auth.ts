import { Request, Response, NextFunction } from 'express';
import { supabasePublic, query } from '../db/supabase.js';
import { logAuditEvent } from '../db/audit.js';
import { accessTokenStore } from '../oauth/alexaOAuth.js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  role?: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
    }
  }
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected Bearer token.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // 1. Check if token is an active Alexa+ OAuth 2.1 access token
  const oauthToken = accessTokenStore.get(token);
  if (oauthToken) {
    if (Date.now() > oauthToken.expiresAt) {
      accessTokenStore.delete(token);
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid, revoked, or expired authentication token.',
      });
      return;
    }

    let email: string | undefined;
    try {
      const p = await query('SELECT email FROM public.profiles WHERE id = $1', [oauthToken.userId]);
      email = p.rows[0]?.email;
    } catch {
      // ignore
    }

    req.user = {
      id: oauthToken.userId,
      email: email || 'alexa.demo@example.com',
      role: 'authenticated',
      user_metadata: { source: 'alexa_oauth', clientId: oauthToken.clientId, scope: oauthToken.scope },
    };
    req.token = token;
    return next();
  }

  // 2. Otherwise verify token with Supabase Auth
  try {
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);

    if (error || !user) {
      await logAuditEvent({
        eventType: 'auth_validation_failed',
        status: 'denied',
        details: { error: error?.message || 'Invalid or expired user session' },
        ipAddress: req.ip,
      });

      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid, revoked, or expired authentication token.',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      role: user.role,
    };
    req.token = token;

    next();
  } catch (err: any) {
    console.error('Authentication verification error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication service encountered an error.',
    });
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  // 1. Check OAuth access token store
  const oauthToken = accessTokenStore.get(token);
  if (oauthToken && Date.now() <= oauthToken.expiresAt) {
    let email: string | undefined;
    try {
      const p = await query('SELECT email FROM public.profiles WHERE id = $1', [oauthToken.userId]);
      email = p.rows[0]?.email;
    } catch {
      // ignore
    }

    req.user = {
      id: oauthToken.userId,
      email: email || 'alexa.demo@example.com',
      role: 'authenticated',
      user_metadata: { source: 'alexa_oauth' },
    };
    req.token = token;
    return next();
  }

  // 2. Check Supabase token
  try {
    const { data: { user } } = await supabasePublic.auth.getUser(token);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        role: user.role,
      };
      req.token = token;
    }
  } catch {
    // optional auth ignore error
  }

  next();
}
