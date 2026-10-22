import { Router } from 'express';
import { query } from '../db/supabase.js';
import { config } from '../config.js';

const router = Router();

router.get('/', async (_req, res) => {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await query('SELECT 1');
    dbLatencyMs = Date.now() - dbStart;
  } catch (error: any) {
    dbStatus = `unhealthy: ${error.message}`;
  }

  const isHealthy = dbStatus === 'healthy';

  res.status(200).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'Alexa+ Smart Assistant Backend',
    mcpServer: config.MCP_SERVER_NAME,
    mcpProtocolVersion: '2025-11-25',
    mcpEndpoint: config.MCP_ENDPOINT_PATH,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      provider: 'Supabase PostgreSQL',
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    aiModel: config.GEMINI_MODEL,
    totalResponseTimeMs: Date.now() - startTime,
  });
});

export default router;
