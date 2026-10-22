import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';

describe('Authentication & Authorization Middleware', () => {
  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const endpoints = [
      { method: 'get', path: '/api/tasks' },
      { method: 'post', path: '/api/tasks' },
      { method: 'get', path: '/api/reminders' },
      { method: 'post', path: '/api/reminders' },
      { method: 'get', path: '/api/notes' },
      { method: 'get', path: '/api/audit' },
      { method: 'post', path: '/mcp/execute' },
    ];

    for (const ep of endpoints) {
      const res = await (request(app) as any)[ep.method](ep.path);
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    }
  });

  it('rejects requests with malformed Authorization header with 401', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Basic dXNlcjpwYXNz');

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Expected Bearer token');
  });

  it('rejects requests with forged or invalid Bearer token with 401', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer forged.invalid.token');

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Invalid, revoked, or expired');
  });
});
