import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { query } from '../src/db/supabase.js';

describe('Auth Endpoints & Registration Fix', () => {
  const testEmail = `auto.test.${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let createdUserId: string | null = null;

  afterAll(async () => {
    if (createdUserId) {
      await query('DELETE FROM public.profiles WHERE id = $1::uuid', [createdUserId]);
      await query('DELETE FROM auth.identities WHERE user_id = $1::uuid', [createdUserId]);
      await query('DELETE FROM auth.users WHERE id = $1::uuid', [createdUserId]);
    }
  });

  it('GET /api/auth/lookup checks if email exists', async () => {
    const res = await request(app).get('/api/auth/lookup?email=alexa.demo@example.com');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      exists: true,
      email: 'alexa.demo@example.com',
    });

    const unknownRes = await request(app).get('/api/auth/lookup?email=nonexistent_user_99999@test.com');
    expect(unknownRes.status).toBe(200);
    expect(unknownRes.body.exists).toBe(false);
  });

  it('POST /api/auth/register creates a verified user account bypassing SMTP rate limit', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        displayName: 'Automated Test User',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.display_name).toBe('Automated Test User');

    createdUserId = res.body.user.id;

    // Verify user exists and email is confirmed in auth.users
    const dbCheck = await query('SELECT id, email, email_confirmed_at FROM auth.users WHERE id = $1::uuid', [createdUserId]);
    expect(dbCheck.rows.length).toBe(1);
    expect(dbCheck.rows[0].email_confirmed_at).not.toBeNull();
  });

  it('POST /api/auth/register rejects duplicate registration attempt', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'User already exists');
  });

  it('POST /api/auth/reset-password updates password for existing user', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: testEmail,
        newPassword: 'NewPassword2026!',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/auth/reset-password returns 404 for nonexistent email', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'nobody_here_random_12345@test.com',
        newPassword: 'NewPassword2026!',
      });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'User not found');
  });
});
