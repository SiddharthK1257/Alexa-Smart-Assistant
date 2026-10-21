import { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createUserMcpServer } from './server.js';
import { supabasePublic } from '../db/supabase.js';
import { logAuditEvent } from '../db/audit.js';
import { accessTokenStore } from '../oauth/alexaOAuth.js';

// Cache active transports by session ID if persistent SSE connections are used
const transports = new Map<string, StreamableHTTPServerTransport>();

export async function handleStreamableMcpRequest(req: Request, res: Response): Promise<void> {
  // 1. Verify User Authentication
  // Token can come from Authorization header: "Bearer <token>"
  let userId: string | null = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    // Check OAuth access token store first
    const oauthToken = accessTokenStore.get(token);
    if (oauthToken && Date.now() <= oauthToken.expiresAt) {
      userId = oauthToken.userId;
    } else {
      try {
        const { data: { user } } = await supabasePublic.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch {
        // invalid token
      }
    }
  }

  // If unauthenticated, reject with 401 and JSON-RPC error format if request is JSON-RPC
  if (!userId) {
    await logAuditEvent({
      eventType: 'mcp_unauthorized_access',
      status: 'denied',
      details: { path: req.path, method: req.method },
      ipAddress: req.ip,
    });

    res.status(401).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Unauthorized: Valid Supabase or Alexa+ OAuth Bearer token required for MCP operations.',
      },
      id: req.body?.id || null,
    });
    return;
  }

  try {
    // Check if session ID provided in query or header
    const sessionId = (req.query.sessionId as string) || (req.headers['mcp-session-id'] as string);

    let transport: StreamableHTTPServerTransport;
    if (sessionId && transports.has(sessionId)) {
      transport = transports.get(sessionId)!;
    } else {
      transport = new StreamableHTTPServerTransport();
      const mcpServer = createUserMcpServer(userId);
      await mcpServer.connect(transport);

      if (transport.sessionId) {
        transports.set(transport.sessionId, transport);
        transport.onclose = () => {
          if (transport.sessionId) {
            transports.delete(transport.sessionId);
          }
        };
      }
    }

    // Streamable HTTP transport handles incoming request & streams response
    await transport.handleRequest(req, res, req.body);

  } catch (error: any) {
    console.error('MCP Streamable HTTP Transport error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: `Internal MCP error: ${error.message}`,
        },
        id: req.body?.id || null,
      });
    }
  }
}
