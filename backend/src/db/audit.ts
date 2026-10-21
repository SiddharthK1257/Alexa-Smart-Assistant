import { query } from './supabase.js';

export interface AuditEventParams {
  userId?: string | null;
  eventType: string;
  toolName?: string | null;
  status: 'success' | 'failure' | 'denied' | 'error';
  details?: Record<string, any>;
  ipAddress?: string | null;
}

// Redact any sensitive information before logging
function sanitizeDetails(details: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'apikey', 'key', 'refresh_token', 'access_token'];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(details)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeDetails(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const sanitizedDetails = params.details ? sanitizeDetails(params.details) : {};
    
    await query(
      `INSERT INTO public.audit_events (user_id, event_type, tool_name, status, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.userId || null,
        params.eventType,
        params.toolName || null,
        params.status,
        JSON.stringify(sanitizedDetails),
        params.ipAddress || null,
      ]
    );
  } catch (error) {
    // We log to stderr but do not crash the application if an audit insert fails
    console.error('Failed to write audit event:', error);
  }
}
