import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import healthRouter from './routes/health.js';
import mcpRouter from './routes/mcpRoutes.js';
import assistantRouter from './routes/assistant.js';
import tasksRouter from './routes/tasks.js';
import remindersRouter from './routes/reminders.js';
import notesRouter from './routes/notes.js';
import auditRouter from './routes/audit.js';
import profileRouter from './routes/profile.js';
import conversationsRouter from './routes/conversations.js';
import authRouter from './routes/auth.js';
import { featuresRouter } from './routes/features.js';
import {
  getAuthorizationServerMetadata,
  getProtectedResourceMetadata,
  handleAuthorizeRequest,
  handleTokenRequest,
  handleRevokeRequest,
  handleUserInfoRequest,
} from './oauth/alexaOAuth.js';
import { optionalAuth, authenticateUser } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Middlewares
app.use(cors({
  origin: (_origin, callback) => {
    // Reflect origin to support localhost, Vercel deployments, and external MCP clients
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'mcp-session-id', 'apikey'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for security & audit tracing
app.use((req, _res, next) => {
  if (config.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// 1. Health check endpoint (available at /health and /api/health)
app.use('/health', healthRouter);
app.use('/api/health', healthRouter);

// 2. Streamable HTTP MCP Endpoint
app.use('/mcp', mcpRouter);

// 3. Alexa+ OAuth 2.1 RFC Metadata Endpoints
app.get('/.well-known/oauth-authorization-server', getAuthorizationServerMetadata);
app.get('/.well-known/oauth-protected-resource', getProtectedResourceMetadata);

// 4. Alexa+ OAuth 2.1 Flow Endpoints
app.get('/oauth/authorize', optionalAuth, handleAuthorizeRequest);
app.post('/oauth/token', handleTokenRequest);
app.post('/oauth/revoke', handleRevokeRequest);
app.get('/oauth/userinfo', authenticateUser, handleUserInfoRequest);

// 5. REST Endpoints for Frontend Client
app.use('/api/assistant', assistantRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/notes', notesRouter);
app.use('/api/audit', auditRouter);
app.use('/api/profile', profileRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/auth', authRouter);
app.use('/api', featuresRouter);

// 6. Public Compliance Pages (Alexa+ Add-on Requirement)
app.get('/privacy', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Privacy Policy - Alexa+ Smart Assistant</title></head>
    <body style="font-family: system-ui, sans-serif; background: #0B0F19; color: #E5E7EB; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6;">
      <h1 style="color: #00CAFF;">Privacy Policy — Alexa+ Smart Assistant (Supabase Edition)</h1>
      <p><em>Effective Date: October 21, 2026 | Independent Prototype</em></p>
      <h2>1. Information We Collect</h2>
      <p>This prototype collects user email, tasks, reminders, and notes provided directly through voice or text input.</p>
      <h2>2. Data Storage & Security</h2>
      <p>All data is stored securely in Supabase PostgreSQL with PostgreSQL Row Level Security (RLS) enforcing strict per-user isolation.</p>
      <h2>3. AI Processing</h2>
      <p>Natural language interactions are processed via Google Gemini API solely to execute user requests. Audio data is not stored permanently.</p>
      <h2>4. Independent Prototype Disclaimer</h2>
      <p>This application is an independent developer prototype and is not affiliated with, endorsed by, or an official product of Amazon.com, Inc.</p>
    </body>
    </html>
  `);
});

app.get('/terms', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Terms of Use - Alexa+ Smart Assistant</title></head>
    <body style="font-family: system-ui, sans-serif; background: #0B0F19; color: #E5E7EB; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6;">
      <h1 style="color: #00CAFF;">Terms of Use — Alexa+ Smart Assistant (Supabase Edition)</h1>
      <p><em>Effective Date: October 21, 2026 | Independent Prototype</em></p>
      <h2>1. Permitted Use</h2>
      <p>This software is provided for evaluation, prototype demonstrations, and MCP tool development.</p>
      <h2>2. No Warranty</h2>
      <p>The software is provided "AS IS", without warranty of any kind, express or implied.</p>
      <h2>3. Intellectual Property Notice</h2>
      <p>"Alexa" is a trademark of Amazon.com, Inc. This application is an independent integration prototype utilizing the Model Context Protocol (MCP).</p>
    </body>
    </html>
  `);
});

// Global Error Handler
app.use(errorHandler);

// Server startup if executed directly
if (process.env.NODE_ENV !== 'test') {
  const port = config.PORT;
  app.listen(port, () => {
    console.log(`
🚀 ============================================================
   Alexa+ Smart Assistant (Supabase Edition) Backend Started
   Port:            ${port}
   Environment:     ${config.NODE_ENV}
   Health:          http://localhost:${port}/health
   MCP Endpoint:    http://localhost:${port}/mcp
   MCP Tools:       http://localhost:${port}/mcp/tools
   OAuth Auth:      http://localhost:${port}/.well-known/oauth-authorization-server
   OAuth Resource:  http://localhost:${port}/.well-known/oauth-protected-resource
   AI Model:        ${config.GEMINI_MODEL}
   Supabase URL:    ${config.SUPABASE_URL}
============================================================
    `);
  });
}
