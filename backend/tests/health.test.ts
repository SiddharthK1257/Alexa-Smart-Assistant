import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';

describe('Health and Status Endpoints', () => {
  it('GET /health returns healthy status, database connectivity, and MCP metadata', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'Alexa+ Smart Assistant Backend');
    expect(res.body).toHaveProperty('mcpProtocolVersion', '2024-11-05');
    expect(res.body).toHaveProperty('mcpEndpoint', '/mcp');
    expect(res.body.database).toHaveProperty('status', 'healthy');
    expect(res.body.database).toHaveProperty('provider', 'Supabase PostgreSQL');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });

  it('GET /privacy and GET /terms serve public compliance pages', async () => {
    const privacyRes = await request(app).get('/privacy');
    expect(privacyRes.status).toBe(200);
    expect(privacyRes.text).toContain('Privacy Policy');
    expect(privacyRes.text).toContain('Independent Prototype');

    const termsRes = await request(app).get('/terms');
    expect(termsRes.status).toBe(200);
    expect(termsRes.text).toContain('Terms of Use');
  });
});
