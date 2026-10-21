import crypto from 'crypto';
import { Request, Response } from 'express';
import { config } from '../config.js';
import { query } from '../db/supabase.js';
import { logAuditEvent } from '../db/audit.js';

interface AuthCodeData {
  code: string;
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  expiresAt: number;
}

export interface StoredAccessToken {
  token: string;
  userId: string;
  clientId: string;
  scope: string;
  expiresAt: number;
}

// In-memory store for authorization codes, access tokens, and refresh tokens
export const authCodeStore = new Map<string, AuthCodeData>();
export const accessTokenStore = new Map<string, StoredAccessToken>();
export const refreshTokenStore = new Map<string, { userId: string; clientId: string; scope: string; expiresAt: number }>();

// 1. RFC 8414 OAuth 2.0 Authorization Server Metadata
export function getAuthorizationServerMetadata(_req: Request, res: Response): void {
  const baseUrl = config.OAUTH_ISSUER_URL;

  res.setHeader('Content-Type', 'application/json');
  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
    revocation_endpoint: `${baseUrl}/oauth/revoke`,
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: [
      'alexa:assistant',
      'tasks:read',
      'tasks:write',
      'reminders:read',
      'reminders:write',
      'notes:read',
      'notes:write',
      'offline_access',
    ],
    service_documentation: 'https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart',
    ui_locales_supported: ['en-US'],
  });
}

// 2. RFC 9470 OAuth 2.0 Protected Resource Metadata
export function getProtectedResourceMetadata(_req: Request, res: Response): void {
  const baseUrl = config.OAUTH_ISSUER_URL;

  res.setHeader('Content-Type', 'application/json');
  res.json({
    resource: `${baseUrl}/mcp`,
    authorization_servers: [baseUrl],
    scopes_supported: [
      'alexa:assistant',
      'tasks:read',
      'tasks:write',
      'reminders:read',
      'reminders:write',
      'notes:read',
      'notes:write',
    ],
    bearer_methods_supported: ['header'],
    resource_documentation: `${baseUrl}/docs/mcp`,
  });
}

// 3. GET /oauth/authorize (Authorization code flow with PKCE)
export async function handleAuthorizeRequest(req: Request, res: Response): Promise<void> {
  const {
    response_type,
    client_id,
    redirect_uri,
    scope = 'alexa:assistant tasks:read tasks:write reminders:read reminders:write notes:read notes:write',
    state,
    code_challenge,
    code_challenge_method = 'S256',
  } = req.query as Record<string, string>;

  if (response_type !== 'code') {
    res.status(400).send('Unsupported response_type. Must be "code".');
    return;
  }

  if (!code_challenge) {
    res.status(400).send('OAuth 2.1 requires code_challenge for PKCE security.');
    return;
  }

  // Use authenticated user or fallback demo user for development/linking
  let targetUserId: string = req.user?.id || 'a0000000-0000-0000-0000-000000000001';
  if (!req.user?.id) {
    // Check if demo user exists in auth.users
    const demoUser = await query('SELECT id FROM auth.users LIMIT 1');
    if (demoUser.rows[0]?.id) {
      targetUserId = demoUser.rows[0].id;
    }
  }

  // Generate a cryptographically secure authorization code
  const code = 'ac_' + crypto.randomBytes(32).toString('hex');
  authCodeStore.set(code, {
    code,
    userId: targetUserId,
    clientId: client_id || config.OAUTH_CLIENT_ID,
    redirectUri: redirect_uri || config.OAUTH_REDIRECT_URI,
    codeChallenge: code_challenge as string,
    codeChallengeMethod: code_challenge_method || 'S256',
    scope: scope || 'alexa:assistant',
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  await logAuditEvent({
    userId: targetUserId,
    eventType: 'oauth_code_issued',
    status: 'success',
    details: { clientId: client_id, scope, redirectUri: redirect_uri },
    ipAddress: req.ip,
  });

  // If redirect_uri is specified, redirect with code & state
  if (redirect_uri) {
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (state) redirectUrl.searchParams.set('state', state);
    res.redirect(redirectUrl.toString());
  } else {
    // Return HTML consent approval page for prototype test
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Alexa+ Account Linking</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0B0F19; color: #fff; padding: 2rem;">
          <div style="max-width: 500px; margin: 40px auto; background: #111827; border: 1px solid #374151; border-radius: 12px; padding: 24px;">
            <h2 style="color: #00CAFF;">Alexa+ Account Linking</h2>
            <p>Your Alexa+ device is requesting access to your Smart Assistant tasks, reminders, and notes.</p>
            <div style="background: #1F2937; padding: 12px; border-radius: 8px; margin: 16px 0; word-break: break-all;">
              <strong>Authorization Code:</strong><br>
              <code>${code}</code>
            </div>
            <p style="color: #9CA3AF; font-size: 0.875rem;">This code expires in 10 minutes and can be exchanged for an access token via PKCE.</p>
          </div>
        </body>
      </html>
    `);
  }
}

// 4. POST /oauth/token (Exchange code with PKCE verification)
export async function handleTokenRequest(req: Request, res: Response): Promise<void> {
  const {
    grant_type,
    code,
    redirect_uri,
    client_id,
    code_verifier,
    refresh_token,
  } = req.body;

  if (grant_type === 'authorization_code') {
    if (!code || !code_verifier) {
      res.status(400).json({ error: 'invalid_request', error_description: 'code and code_verifier are required' });
      return;
    }

    const codeData = authCodeStore.get(code);
    if (!codeData) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code' });
      return;
    }

    if (Date.now() > codeData.expiresAt) {
      authCodeStore.delete(code);
      res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code has expired' });
      return;
    }

    // Verify PKCE code_challenge using SHA-256
    const computedChallenge = crypto
      .createHash('sha256')
      .update(code_verifier)
      .digest('base64url');

    if (computedChallenge !== codeData.codeChallenge) {
      await logAuditEvent({
        userId: codeData.userId,
        eventType: 'oauth_pkce_verification_failed',
        status: 'denied',
        details: { clientId: client_id },
        ipAddress: req.ip,
      });

      res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE code_verifier verification failed' });
      return;
    }

    // Code is single use - delete immediately
    authCodeStore.delete(code);

    // Issue tokens
    const accessToken = 'alexa_at_' + crypto.randomBytes(32).toString('hex');
    const newRefreshToken = 'alexa_rt_' + crypto.randomBytes(32).toString('hex');

    accessTokenStore.set(accessToken, {
      token: accessToken,
      userId: codeData.userId,
      clientId: codeData.clientId,
      scope: codeData.scope,
      expiresAt: Date.now() + 3600 * 1000, // 1 hour
    });

    refreshTokenStore.set(newRefreshToken, {
      userId: codeData.userId,
      clientId: codeData.clientId,
      scope: codeData.scope,
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000, // 30 days
    });

    await logAuditEvent({
      userId: codeData.userId,
      eventType: 'oauth_token_issued',
      status: 'success',
      details: { grant_type: 'authorization_code' },
      ipAddress: req.ip,
    });

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: newRefreshToken,
      scope: codeData.scope,
    });
    return;
  }

  if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      res.status(400).json({ error: 'invalid_request', error_description: 'refresh_token is required' });
      return;
    }

    const rtData = refreshTokenStore.get(refresh_token);
    if (!rtData || Date.now() > rtData.expiresAt) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired refresh token' });
      return;
    }

    const newAccessToken = 'alexa_at_' + crypto.randomBytes(32).toString('hex');
    accessTokenStore.set(newAccessToken, {
      token: newAccessToken,
      userId: rtData.userId,
      clientId: rtData.clientId,
      scope: rtData.scope,
      expiresAt: Date.now() + 3600 * 1000, // 1 hour
    });

    res.json({
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: rtData.scope,
    });
    return;
  }

  res.status(400).json({ error: 'unsupported_grant_type' });
}

// 5. POST /oauth/revoke (RFC 7009 Token Revocation)
export async function handleRevokeRequest(req: Request, res: Response): Promise<void> {
  const { token, token_type_hint } = req.body || {};

  if (token) {
    let revoked = false;
    if (accessTokenStore.has(token)) {
      const stored = accessTokenStore.get(token);
      accessTokenStore.delete(token);
      revoked = true;
      if (stored) {
        await logAuditEvent({
          userId: stored.userId,
          eventType: 'oauth_token_revoked',
          status: 'success',
          details: { token_type_hint: token_type_hint || 'access_token' },
          ipAddress: req.ip,
        });
      }
    }

    if (refreshTokenStore.has(token)) {
      const stored = refreshTokenStore.get(token);
      refreshTokenStore.delete(token);
      revoked = true;
      if (stored) {
        await logAuditEvent({
          userId: stored.userId,
          eventType: 'oauth_token_revoked',
          status: 'success',
          details: { token_type_hint: token_type_hint || 'refresh_token' },
          ipAddress: req.ip,
        });
      }
    }
  }

  // RFC 7009 Section 2.2: The authorization server responds with HTTP status code 200
  // if the token has been revoked or if the token is invalid.
  res.status(200).json({ revoked: true });
}

// 6. GET /oauth/userinfo
export async function handleUserInfoRequest(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const profile = await query('SELECT * FROM public.profiles WHERE id = $1', [req.user.id]);
  const userRow = profile.rows[0];

  res.json({
    sub: req.user.id,
    email: req.user.email || userRow?.email,
    name: userRow?.display_name || 'Alexa+ User',
    updated_at: userRow?.updated_at,
  });
}
