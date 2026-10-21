import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/server.js';
import { accessTokenStore } from '../src/oauth/alexaOAuth.js';

describe('Comprehensive End-to-End API Endpoints Test Suite', () => {
  const testUserId = 'a0000000-0000-0000-0000-000000000001';
  let testOAuthToken: string;

  beforeAll(() => {
    // Generate valid test OAuth access token
    testOAuthToken = 'alexa_at_' + crypto.randomBytes(32).toString('hex');
    accessTokenStore.set(testOAuthToken, {
      token: testOAuthToken,
      userId: testUserId,
      clientId: 'alexa-plus-client',
      scope: 'alexa:assistant tasks:read tasks:write reminders:read reminders:write notes:read notes:write',
      expiresAt: Date.now() + 3600 * 1000,
    });
  });

  // 1. Health Endpoints
  describe('Health Endpoints', () => {
    it('GET /health returns healthy status and metadata', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('database');
      expect(res.body.database.status).toBe('healthy');
    });

    it('GET /api/health also returns healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });
  });

  // 2. OAuth Metadata & Discovery
  describe('OAuth & Compliance Endpoints', () => {
    it('GET /.well-known/oauth-authorization-server conforms to RFC 8414', async () => {
      const res = await request(app).get('/.well-known/oauth-authorization-server');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('authorization_endpoint');
      expect(res.body).toHaveProperty('revocation_endpoint');
    });

    it('GET /.well-known/oauth-protected-resource conforms to RFC 9470', async () => {
      const res = await request(app).get('/.well-known/oauth-protected-resource');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('resource');
    });

    it('GET /privacy and GET /terms serve public compliance HTML', async () => {
      const privacyRes = await request(app).get('/privacy');
      expect(privacyRes.status).toBe(200);
      expect(privacyRes.text).toContain('Privacy Policy');

      const termsRes = await request(app).get('/terms');
      expect(termsRes.status).toBe(200);
      expect(termsRes.text).toContain('Terms of Use');
    });
  });

  // 3. User Profile Endpoints
  describe('User Profile Endpoints', () => {
    it('GET /api/profile returns user profile', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${testOAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('profile');
      expect(res.body.profile.id).toBe(testUserId);
    });

    it('PATCH /api/profile updates user display name and preferences', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${testOAuthToken}`)
        .send({
          display_name: 'Alexa Super Tester',
          preferences: { voice_muted: true, speech_rate: 1.2, theme: 'dark_cyan' },
        });

      expect(res.status).toBe(200);
      expect(res.body.profile.display_name).toBe('Alexa Super Tester');
      expect(res.body.profile.preferences.voice_muted).toBe(true);
    });
  });

  // 4. Tasks REST Endpoints
  describe('Tasks Endpoints', () => {
    let createdTaskId: string;

    it('POST /api/tasks creates a new task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testOAuthToken}`)
        .send({
          title: 'Full Stack Integration Task',
          description: 'Testing task lifecycle through REST',
          priority: 'high',
          due_date: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.task).toHaveProperty('id');
      expect(res.body.task.title).toBe('Full Stack Integration Task');
      createdTaskId = res.body.task.id;
    });

    it('GET /api/tasks lists tasks with optional status and limit', async () => {
      const res = await request(app)
        .get('/api/tasks?limit=10&status=all')
        .set('Authorization', `Bearer ${testOAuthToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tasks)).toBe(true);
      expect(res.body.tasks.some((t: any) => t.id === createdTaskId)).toBe(true);
    });

    it('GET /api/tasks/:id retrieves single task', async () => {
      const res = await request(app)
        .get(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${testOAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body.task.id).toBe(createdTaskId);
    });

    it('PATCH /api/tasks/:id and PUT /api/tasks/:id update the task', async () => {
      const patchRes = await request(app)
        .patch(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${testOAuthToken}`)
        .send({ status: 'completed' });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.task.status).toBe('completed');

      const putRes = await request(app)
        .put(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${testOAuthToken}`)
        .send({ priority: 'urgent' });

      expect(putRes.status).toBe(200);
      expect(putRes.body.task.priority).toBe('urgent');
    });

    it('DELETE /api/tasks/:id requires confirm=true and deletes', async () => {
      // Missing confirm -> 400
      const failRes = await request(app)
        .delete(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${testOAuthToken}`);
      expect(failRes.status).toBe(400);

      // With confirm -> 200
      const okRes = await request(app)
        .delete(`/api/tasks/${createdTaskId}?confirm=true`)
        .set('Authorization', `Bearer ${testOAuthToken}`);
      expect(okRes.status).toBe(200);
      expect(okRes.body.deleted).toBe(true);

      // Subsequent GET returns 404
      const get404 = await request(app)
        .get(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${testOAuthToken}`);
      expect(get404.status).toBe(404);
    });
  });

  // 5. Reminders REST Endpoints
  describe('Reminders Endpoints', () => {
    let createdReminderId: string;

    it('POST /api/reminders creates a reminder', async () => {
      const res = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${testOAuthToken}`)
        .send({
          message: 'Review integration endpoints',
          scheduled_time: new Date(Date.now() + 3600000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.reminder).toHaveProperty('id');
      createdReminderId = res.body.reminder.id;
    });

    it('GET /api/reminders and GET /api/reminders/:id', async () => {
      const listRes = await request(app)
        .get('/api/reminders')
        .set('Authorization', `Bearer ${testOAuthToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.reminders.some((r: any) => r.id === createdReminderId)).toBe(true);

      const singleRes = await request(app)
        .get(`/api/reminders/${createdReminderId}`)
        .set('Authorization', `Bearer ${testOAuthToken}`);
      expect(singleRes.status).toBe(200);
      expect(singleRes.body.reminder.id).toBe(createdReminderId);
    });

    it('PATCH /api/reminders/:id updates reminder', async () => {
      const res = await request(app)
        .patch(`/api/reminders/${createdReminderId}`)
        .set('Authorization', `Bearer ${testOAuthToken}`)
        .send({ status: 'dismissed' });

      expect(res.status).toBe(200);
      expect(res.body.reminder.status).toBe('dismissed');
    });

    it('DELETE /api/reminders/:id deletes with confirmation', async () => {
      const delRes = await request(app)
        .delete(`/api/reminders/${createdReminderId}?confirm=true`)
        .set('Authorization', `Bearer ${testOAuthToken}`);
      expect(delRes.status).toBe(200);
      expect(delRes.body.deleted).toBe(true);
    });
  });

  // 6. Notes REST Endpoints
  describe('Notes Endpoints', () => {
    let createdNoteId: string;

    it('POST /api/notes creates note', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${testOAuthToken}`)
        .send({
          title: 'Endpoint Verification',
          content: 'Every endpoint tested and verified.',
          tags: ['qa', 'rest', 'endpoints'],
        });

      expect(res.status).toBe(201);
      expect(res.body.note).toHaveProperty('id');
      createdNoteId = res.body.note.id;
    });

    it('GET /api/notes, GET /api/notes/search, and GET /api/notes/:id', async () => {
      const listRes = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${testOAuthToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.notes.some((n: any) => n.id === createdNoteId)).toBe(true);

      const searchRes = await request(app)
        .get('/api/notes/search?query=Verification')
        .set('Authorization', `Bearer ${testOAuthToken}`);
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.notes.some((n: any) => n.id === createdNoteId)).toBe(true);

      const singleRes = await request(app)
        .get(`/api/notes/${createdNoteId}`)
        .set('Authorization', `Bearer ${testOAuthToken}`);
      expect(singleRes.status).toBe(200);
      expect(singleRes.body.note.id).toBe(createdNoteId);
    });

    it('PATCH /api/notes/:id updates note', async () => {
      const patchRes = await request(app)
        .patch(`/api/notes/${createdNoteId}`)
        .set('Authorization', `Bearer ${testOAuthToken}`)
        .send({ content: 'Updated content verification.' });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.note.content).toBe('Updated content verification.');
    });

    it('DELETE /api/notes/:id deletes with confirmation', async () => {
      const delRes = await request(app)
        .delete(`/api/notes/${createdNoteId}?confirm=true`)
        .set('Authorization', `Bearer ${testOAuthToken}`);
      expect(delRes.status).toBe(200);
      expect(delRes.body.deleted).toBe(true);
    });
  });

  // 7. Audit Log Endpoints
  describe('Audit Logs Endpoint', () => {
    it('GET /api/audit returns logged user audit events', async () => {
      const res = await request(app)
        .get('/api/audit?limit=20')
        .set('Authorization', `Bearer ${testOAuthToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.auditEvents)).toBe(true);
      expect(res.body.auditEvents.length).toBeGreaterThan(0);
    });
  });

  // 8. MCP Tools & Execution
  describe('MCP Endpoints', () => {
    it('GET /mcp/tools lists available tools', async () => {
      const res = await request(app).get('/mcp/tools');
      expect(res.status).toBe(200);
      expect(res.body.tools.length).toBe(9);
    });

    it('POST /mcp/execute executes MCP tools with OAuth token', async () => {
      const res = await request(app)
        .post('/mcp/execute')
        .set('Authorization', `Bearer ${testOAuthToken}`)
        .send({
          tool: 'get_assistant_status',
          arguments: {},
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result).toHaveProperty('status', 'healthy');
    });
  });

  // 9. AI Assistant Endpoints
  describe('AI Assistant Chat Endpoint', () => {
    it('POST /api/assistant/chat processes natural language request', async () => {
      const res = await request(app)
        .post('/api/assistant/chat')
        .set('Authorization', `Bearer ${testOAuthToken}`)
        .send({
          message: 'What is your current system status?',
          history: [],
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('response');
      expect(typeof res.body.response).toBe('string');
      expect(res.body.response.length).toBeGreaterThan(0);
      expect(Array.isArray(res.body.toolExecutions)).toBe(true);
    });
  });
});
