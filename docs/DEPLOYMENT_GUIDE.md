# DEPLOYMENT GUIDE — ALEXA+ SMART ASSISTANT
**Application:** Alexa+ Smart Assistant (Supabase Edition)  
**Target Environments:** Vercel (Frontend), Render / Fly.io / Railway (Backend), Supabase (Managed PostgreSQL & Auth)  

---

## 1. Architecture & Deployment Overview

```
[ Web Browser Client ] ---------> [ Frontend CDN (Vercel / Netlify) ]
         |                                      |
         | (API Calls / MCP Requests)           | (Static Assets)
         v                                      v
[ Express MCP Backend (Render / Fly.io) ] <-----+
         |
         +-----> [ Supabase PostgreSQL (RLS Enforced) ]
         +-----> [ Google Gemini 3.8 Flash API ]
         +-----> [ Amazon Alexa+ MCP Toolkit Integration ]
```

---

## 2. Supabase Configuration (Database & Auth)

1. **Project Setup:**
   * Create or use an existing Supabase project at [https://supabase.com/dashboard](https://supabase.com/dashboard).
   * Retrieve your **Project URL** and **Publishable Key** from `Project Settings > API`.
   * Retrieve your **Direct Database Connection String** from `Project Settings > Database > Connection string (URI)`.
2. **Apply Database Migrations:**
   Run migrations from your terminal:
   ```bash
   npm run db:migrate
   ```
   This will automatically apply:
   * `20261021000001_create_schema.sql` (profiles, tasks, reminders, notes, audit_events)
   * `20261021000002_seed_dev_data.sql` (pre-seeded demo account)
   * `20261021000003_add_conversations_and_messages.sql` (conversations & messages)
3. **Verify Row Level Security:**
   In Supabase Studio, check that RLS is toggled **ON** for all public tables.

---

## 3. Backend Deployment (Render / Fly.io / Docker)

### 3.1 Environment Variables Required on Server
```ini
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-app.vercel.app

# Google Gemini API
GEMINI_API_KEY=<your_gemini_api_key>
GEMINI_MODEL=gemini-3.8-flash

# Supabase
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your_publishable_key>
DATABASE_URL=postgresql://postgres:<password>@db.<your-project-id>.supabase.co:5432/postgres

# MCP Server
MCP_SERVER_NAME="Alexa+ Smart Assistant MCP Server"
MCP_SERVER_VERSION="1.0.0"
MCP_ENDPOINT_PATH="/mcp"

# OAuth 2.1 (Alexa+ Add-on Linking)
OAUTH_ISSUER_URL=https://your-backend-api.onrender.com
OAUTH_CLIENT_ID=alexa-plus-client
OAUTH_CLIENT_SECRET=<generate_a_secure_random_string_32_chars>
OAUTH_REDIRECT_URI=https://pitangui.amazon.com/api/skill/link/<your_skill_id>
```

### 3.2 Build & Start Commands
* **Build Command:** `npm --workspace=backend run build`
* **Start Command:** `npm --workspace=backend run start` (or `node backend/dist/server.js`)
* **Health Check Path:** `/health`

---

## 4. Frontend Deployment (Vercel / Netlify)

### 4.1 Environment Variables Required on Frontend
```ini
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your_publishable_key>
```

### 4.2 Build Settings
* **Root Directory:** `frontend`
* **Framework Preset:** `Vite`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`

### 4.3 Reverse Proxy / Rewrites
If serving frontend and backend under different domains, configure CORS in `backend/src/server.ts` to allow `FRONTEND_URL`, or use a `vercel.json` rewrite:
```json
{
  "rewrites": [
    { "source": "/api/:match*", "destination": "https://your-backend-api.onrender.com/api/:match*" },
    { "source": "/mcp/:match*", "destination": "https://your-backend-api.onrender.com/mcp/:match*" },
    { "source": "/health", "destination": "https://your-backend-api.onrender.com/health" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 5. Security & Production Checklist

- [x] HTTPS enforced for all endpoints.
- [x] `GEMINI_API_KEY` stored exclusively in server environment variables (never client bundle).
- [x] `DATABASE_URL` stored exclusively in server environment variables.
- [x] RLS enabled on all Supabase tables (`auth.uid() = user_id`).
- [x] Rate limiting and request timeout guards configured on Gemini assistant router.
- [x] Prototype disclaimers prominently displayed on marketing and assistant screens.
