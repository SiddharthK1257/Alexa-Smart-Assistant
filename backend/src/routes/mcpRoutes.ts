import { Router } from 'express';
import { handleStreamableMcpRequest } from '../mcp/transport.js';
import { MCP_TOOLS_CATALOG, executeMcpTool } from '../mcp/tools.js';
import { authenticateUser } from '../middleware/auth.js';
import { config } from '../config.js';

const router = Router();

// Streamable HTTP endpoint for MCP JSON-RPC protocol
router.post('/', handleStreamableMcpRequest);

// Protocol discovery & info (or streamable SSE if requested via GET)
router.get('/', (req, res, next) => {
  if (req.headers.accept?.includes('text/event-stream')) {
    return handleStreamableMcpRequest(req, res);
  }

  res.json({
    name: config.MCP_SERVER_NAME,
    version: config.MCP_SERVER_VERSION,
    protocolVersion: '2025-11-25',
    transport: 'Streamable HTTP (JSON-RPC 2.0)',
    endpoint: '/mcp',
    authentication: 'Bearer Token (Supabase JWT or Alexa+ OAuth 2.1)',
    toolsAvailable: MCP_TOOLS_CATALOG.length,
    toolsDocumentation: '/mcp/tools',
  });
});

// GET /mcp/tools — Catalog of all registered MCP tools
router.get('/tools', (_req, res) => {
  const tools = MCP_TOOLS_CATALOG.map(t => ({
    name: t.name,
    description: t.description,
  }));
  res.json({ tools, total: tools.length });
});

// POST /mcp/execute — Direct tool execution for UI testing & MCP inspector
router.post('/execute', authenticateUser, async (req, res, next) => {
  try {
    const { tool, arguments: rawArgs } = req.body;
    if (!tool) {
      res.status(400).json({ error: 'Missing "tool" field in request body' });
      return;
    }

    let args = rawArgs || {};
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch {
        res.status(400).json({ success: false, error: 'Invalid JSON in arguments string' });
        return;
      }
    }

    const result = await executeMcpTool(tool, args, req.user!.id);
    res.json({ success: true, tool, result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
