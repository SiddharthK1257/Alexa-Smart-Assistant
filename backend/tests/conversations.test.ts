import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/server.js';
import { accessTokenStore } from '../src/oauth/alexaOAuth.js';

describe('Conversations & Messages API Endpoints Test Suite', () => {
  const testUserId = 'a0000000-0000-0000-0000-000000000001';
  let testOAuthToken: string;
  let createdConversationId: string;

  beforeAll(() => {
    testOAuthToken = 'alexa_at_' + crypto.randomBytes(32).toString('hex');
    accessTokenStore.set(testOAuthToken, {
      token: testOAuthToken,
      userId: testUserId,
      clientId: 'alexa-plus-client',
      scope: 'alexa:assistant',
      expiresAt: Date.now() + 3600 * 1000,
    });
  });

  it('POST /api/conversations creates a new conversation', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${testOAuthToken}`)
      .send({ title: 'Test Conversation' });

    expect(res.status).toBe(201);
    expect(res.body.conversation).toHaveProperty('id');
    expect(res.body.conversation.title).toBe('Test Conversation');
    expect(res.body.conversation.user_id).toBe(testUserId);
    createdConversationId = res.body.conversation.id;
  });

  it('GET /api/conversations lists user conversations', async () => {
    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${testOAuthToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.conversations)).toBe(true);
    expect(res.body.conversations.some((c: any) => c.id === createdConversationId)).toBe(true);
  });

  it('POST /api/conversations/:id/messages adds a message to the conversation', async () => {
    const res = await request(app)
      .post(`/api/conversations/${createdConversationId}/messages`)
      .set('Authorization', `Bearer ${testOAuthToken}`)
      .send({
        role: 'user',
        content: 'Hello Alexa+, how is the weather today?',
        tool_calls: [],
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toHaveProperty('id');
    expect(res.body.message.content).toBe('Hello Alexa+, how is the weather today?');
    expect(res.body.message.conversation_id).toBe(createdConversationId);
  });

  it('GET /api/conversations/:id returns conversation details and messages', async () => {
    const res = await request(app)
      .get(`/api/conversations/${createdConversationId}`)
      .set('Authorization', `Bearer ${testOAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body.conversation.id).toBe(createdConversationId);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages.length).toBeGreaterThan(0);
  });

  it('PATCH /api/conversations/:id updates the conversation title', async () => {
    const res = await request(app)
      .patch(`/api/conversations/${createdConversationId}`)
      .set('Authorization', `Bearer ${testOAuthToken}`)
      .send({ title: 'Updated Conversation Title' });

    expect(res.status).toBe(200);
    expect(res.body.conversation.title).toBe('Updated Conversation Title');
  });

  it('DELETE /api/conversations/:id removes the conversation', async () => {
    const res = await request(app)
      .delete(`/api/conversations/${createdConversationId}`)
      .set('Authorization', `Bearer ${testOAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });
});
