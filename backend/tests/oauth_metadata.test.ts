import { describe, it, expect } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/server.js';

describe('OAuth 2.1 & Alexa+ Metadata Endpoints', () => {
  it('GET /.well-known/oauth-authorization-server conforms to RFC 8414', async () => {
    const res = await request(app).get('/.well-known/oauth-authorization-server');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('issuer');
    expect(res.body).toHaveProperty('authorization_endpoint');
    expect(res.body).toHaveProperty('token_endpoint');
    expect(res.body.response_types_supported).toContain('code');
    expect(res.body.grant_types_supported).toContain('authorization_code');
    expect(res.body.code_challenge_methods_supported).toContain('S256');
    expect(res.body.scopes_supported).toContain('alexa:assistant');
    expect(res.body.scopes_supported).toContain('tasks:read');
  });

  it('GET /.well-known/oauth-protected-resource conforms to RFC 9470', async () => {
    const res = await request(app).get('/.well-known/oauth-protected-resource');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('resource');
    expect(res.body.resource).toContain('/mcp');
    expect(res.body.authorization_servers).toBeInstanceOf(Array);
    expect(res.body.scopes_supported).toContain('alexa:assistant');
    expect(res.body.bearer_methods_supported).toContain('header');
  });

  it('OAuth 2.1 Authorization Code Flow with PKCE (S256)', async () => {
    // 1. Generate PKCE verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // 2. Authorize request
    const authRes = await request(app)
      .get('/oauth/authorize')
      .query({
        response_type: 'code',
        client_id: 'alexa-plus-client',
        redirect_uri: 'https://pitangui.amazon.com/api/skill/link/prototype',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: 'test-state-1234',
      });

    expect(authRes.status).toBe(302);
    const redirectLocation = authRes.header.location;
    expect(redirectLocation).toContain('code=');
    expect(redirectLocation).toContain('state=test-state-1234');

    const url = new URL(redirectLocation);
    const code = url.searchParams.get('code')!;
    expect(code).toBeTruthy();

    // 3. Attempt token exchange with wrong verifier -> MUST FAIL
    const wrongVerifierRes = await request(app)
      .post('/oauth/token')
      .send({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://pitangui.amazon.com/api/skill/link/prototype',
        client_id: 'alexa-plus-client',
        code_verifier: 'invalid-verifier-string',
      });

    expect(wrongVerifierRes.status).toBe(400);
    expect(wrongVerifierRes.body.error).toBe('invalid_grant');

    // Re-obtain valid code for success test
    const authRes2 = await request(app)
      .get('/oauth/authorize')
      .query({
        response_type: 'code',
        client_id: 'alexa-plus-client',
        redirect_uri: 'https://pitangui.amazon.com/api/skill/link/prototype',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

    const code2 = new URL(authRes2.header.location).searchParams.get('code')!;

    // 4. Token exchange with correct verifier -> SUCCESS
    const tokenRes = await request(app)
      .post('/oauth/token')
      .send({
        grant_type: 'authorization_code',
        code: code2,
        redirect_uri: 'https://pitangui.amazon.com/api/skill/link/prototype',
        client_id: 'alexa-plus-client',
        code_verifier: codeVerifier,
      });

    expect(tokenRes.status).toBe(200);
    expect(tokenRes.body).toHaveProperty('access_token');
    expect(tokenRes.body).toHaveProperty('refresh_token');
    expect(tokenRes.body.token_type).toBe('Bearer');
    expect(tokenRes.body.expires_in).toBe(3600);

    const accessToken = tokenRes.body.access_token;
    const refreshToken = tokenRes.body.refresh_token;

    // 5. Use the OAuth access token to query /oauth/userinfo
    const userInfoRes = await request(app)
      .get('/oauth/userinfo')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(userInfoRes.status).toBe(200);
    expect(userInfoRes.body).toHaveProperty('sub');
    expect(userInfoRes.body).toHaveProperty('name');

    // 6. Use refresh token to obtain new access token
    const refreshRes = await request(app)
      .post('/oauth/token')
      .send({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toHaveProperty('access_token');

    // 7. Revoke token via RFC 7009 endpoint
    const revokeRes = await request(app)
      .post('/oauth/revoke')
      .send({
        token: accessToken,
        token_type_hint: 'access_token',
      });

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body).toHaveProperty('revoked', true);

    // 8. Re-attempting to use revoked token must now fail with 401
    const postRevokeUserInfo = await request(app)
      .get('/oauth/userinfo')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(postRevokeUserInfo.status).toBe(401);
  });
});
