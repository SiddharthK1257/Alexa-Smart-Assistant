# AMAZON ALEXA+ ONBOARDING & MCP TOOLKIT CHECKLIST
**Product:** Alexa+ Smart Assistant (Supabase Edition)  
**Protocol Version:** Streamable HTTP / Model Context Protocol (MCP)  
**Auth Specification:** RFC 8414 OAuth 2.0 Authorization Server / RFC 9470 Protected Resource / RFC 7636 PKCE  
**Official Reference:** [Amazon Alexa+ Add-ons MCP Toolkit Quickstart](https://www.developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart)  

---

## 1. Prerequisites Checklist

Before registering the Add-on in the Amazon Developer Console:
- [x] **Public HTTPS MCP Server:** Backend exposed via HTTPS (e.g. `https://alexa-plus-backend.example.com` or via cloud tunnel like Cloudflare Tunnel / ngrok).
- [x] **Streamable HTTP Transport:** Implemented at endpoint path `/mcp`.
- [x] **Separated Health Endpoint:** Implemented at `/health` returning HTTP 200 with database ping.
- [x] **RFC 8414 Authorization Server Metadata:** Published at `/.well-known/oauth-authorization-server`.
- [x] **RFC 9470 Protected Resource Metadata:** Published at `/.well-known/oauth-protected-resource`.
- [x] **RFC 7636 PKCE Support:** S256 code challenge verification on `/oauth/token`.
- [x] **Compliance Pages:** Live Privacy Policy at `/privacy` and Terms of Use at `/terms`.

---

## 2. Protocol & Transport Specifications

### 2.1 Streamable HTTP Requirements
Amazon Alexa+ MCP Add-ons require the server to maintain a persistent connection or support session identification for streamable tool calls:
* **Endpoint:** `POST https://<your-domain>/mcp`
* **Content-Type:** `application/json`
* **Headers:**
  * `Authorization: Bearer <alexa_oauth_access_token>`
  * `mcp-session-id: <session-uuid>` (Optional session tracking)
* **Response:** Streamable chunked JSON or JSON-RPC 2.0 responses.

### 2.2 OAuth 2.1 Metadata Endpoints

#### Authorization Server Metadata (`/.well-known/oauth-authorization-server`)
```json
{
  "issuer": "https://<your-domain>",
  "authorization_endpoint": "https://<your-domain>/oauth/authorize",
  "token_endpoint": "https://<your-domain>/oauth/token",
  "revocation_endpoint": "https://<your-domain>/oauth/revoke",
  "userinfo_endpoint": "https://<your-domain>/oauth/userinfo",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"],
  "scopes_supported": [
    "alexa:assistant",
    "tasks:read",
    "tasks:write",
    "reminders:read",
    "reminders:write",
    "notes:read",
    "notes:write"
  ]
}
```

#### Protected Resource Metadata (`/.well-known/oauth-protected-resource`)
```json
{
  "resource": "https://<your-domain>/mcp",
  "authorization_servers": ["https://<your-domain>"],
  "scopes_supported": [
    "alexa:assistant",
    "tasks:read",
    "tasks:write",
    "reminders:read",
    "reminders:write",
    "notes:read",
    "notes:write"
  ],
  "bearer_methods_supported": ["header"]
}
```

---

## 3. Step-by-Step Developer Console Registration

1. **Sign in to Developer Console:**
   * Go to [Amazon Developer Console](https://developer.amazon.com/alexa/console/ask).
   * Navigate to **Alexa+ Add-ons / MCP Toolkit**.
2. **Create New Add-on:**
   * **Add-on Name:** `Alexa+ Smart Assistant`
   * **Primary Language:** `English (US)`
   * **Category:** `Productivity & Organization`
3. **Configure MCP Endpoint:**
   * **Transport Type:** `Streamable HTTP`
   * **Endpoint URL:** `https://<your-domain>/mcp`
   * **Health Check URL:** `https://<your-domain>/health`
4. **Configure Account Linking (OAuth 2.1):**
   * **Grant Type:** `Authorization Code Grant`
   * **Authorization URI:** `https://<your-domain>/oauth/authorize`
   * **Access Token URI:** `https://<your-domain>/oauth/token`
   * **Client ID:** Set matching `OAUTH_CLIENT_ID` in `.env`.
   * **Client Secret:** Set matching `OAUTH_CLIENT_SECRET` in `.env`.
   * **Client Authentication Scheme:** `HTTP Basic (Recommended)` or `Credentials in request body`.
   * **Scope:** `alexa:assistant tasks:read tasks:write reminders:read reminders:write notes:read notes:write`
   * **PKCE Support:** Check `Require PKCE (S256)`.
5. **Add Compliance URLs:**
   * **Privacy Policy URL:** `https://<your-domain>/privacy`
   * **Terms of Use URL:** `https://<your-domain>/terms`

---

## 4. Tool Registry & Voice Utterance Examples

| Tool Name | Action | Example Voice Utterance |
| :--- | :--- | :--- |
| `create_task` | Creates task in Supabase | *"Alexa, add a high priority task to review security audit"* |
| `list_tasks` | Lists pending tasks | *"Alexa, what tasks do I have pending?"* |
| `update_task` | Updates status or details | *"Alexa, mark my grocery task as completed"* |
| `create_reminder` | Schedules alert at timestamp | *"Alexa, remind me to drink water in thirty minutes"* |
| `list_reminders` | Retrieves scheduled alerts | *"Alexa, what reminders are scheduled for today?"* |
| `save_note` | Stores markdown note | *"Alexa, take a note about the new MCP protocol specifications"* |
| `search_notes` | Searches notes with tags | *"Alexa, find my notes tagged with architecture"* |
| `get_assistant_status`| Reports system health | *"Alexa, check assistant operational status"* |

---

## 5. Local Simulator & Verification Workflow

To test the integration locally without a public domain:
1. Start local backend: `npm run dev:backend` (runs on `http://localhost:4000`).
2. Start Cloudflare Tunnel or ngrok:
   ```bash
   ngrok http 4000
   ```
3. Update `OAUTH_ISSUER_URL` in `.env` to your public tunnel HTTPS URL.
4. Execute test curl to verify OAuth code flow:
   ```bash
   curl -X GET "http://localhost:4000/.well-known/oauth-authorization-server"
   ```
5. Test MCP tools directly using the built-in **MCP Inspector** at `/app/mcp`.
