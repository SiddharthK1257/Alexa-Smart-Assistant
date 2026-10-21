# MCP TESTING & VERIFICATION GUIDE
**Application:** Alexa+ Smart Assistant (Supabase Edition)  
**Standard:** Model Context Protocol (MCP) Streamable HTTP  
**Endpoint:** `/mcp`  

---

## 1. Quick Verification via Developer UI

The fastest way to test all 8 MCP tools interactively is using the built-in **MCP Inspector**:
1. Open the web interface at `http://localhost:5173`.
2. Click **"Instant Demo"** in the top navigation bar to authenticate.
3. Click the **"MCP & Specs"** tab in navigation (or visit `http://localhost:5173/app/mcp`).
4. Select any tool from the left list (e.g. `create_task`, `list_tasks`, `save_note`, `get_assistant_status`).
5. Inspect the pre-populated JSON payload and click **"Invoke Tool"**.
6. Observe the real-time execution result returned from Supabase PostgreSQL.

---

## 2. Command-Line Verification via `curl`

### 2.1 Discover Available Tools
```bash
curl -X GET http://localhost:4000/mcp/tools
```

### 2.2 Execute `get_assistant_status`
```bash
curl -X POST http://localhost:4000/mcp/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_supabase_jwt_or_oauth_token>" \
  -d '{"tool": "get_assistant_status", "arguments": {}}'
```

### 2.3 Execute `create_task`
```bash
curl -X POST http://localhost:4000/mcp/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_supabase_jwt_or_oauth_token>" \
  -d '{
    "tool": "create_task",
    "arguments": {
      "title": "Evaluate MCP Protocol Compatibility",
      "priority": "urgent",
      "description": "Verified using curl CLI test script"
    }
  }'
```

### 2.4 Execute `list_tasks`
```bash
curl -X POST http://localhost:4000/mcp/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_supabase_jwt_or_oauth_token>" \
  -d '{
    "tool": "list_tasks",
    "arguments": {
      "status": "all",
      "limit": 10
    }
  }'
```

### 2.5 Execute `create_reminder`
```bash
curl -X POST http://localhost:4000/mcp/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_supabase_jwt_or_oauth_token>" \
  -d '{
    "tool": "create_reminder",
    "arguments": {
      "message": "Drink electrolyte water",
      "scheduled_time": "2026-10-21T18:00:00.000Z"
    }
  }'
```

### 2.6 Execute `save_note`
```bash
curl -X POST http://localhost:4000/mcp/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_supabase_jwt_or_oauth_token>" \
  -d '{
    "tool": "save_note",
    "arguments": {
      "title": "MCP Architecture Notes",
      "content": "Streamable HTTP maintains standard JSON-RPC 2.0 payloads for AI tool calls.",
      "tags": ["mcp", "architecture", "docs"]
    }
  }'
```

---

## 3. Automated Vitest MCP Test Suite

To run all automated MCP tests against the real Supabase database:
```bash
npm run test:backend
```
This executes:
* Schema validation tests for all 8 tools.
* Per-user Row Level Security isolation tests.
* Rejection of invalid types or missing required arguments.
* Streamable HTTP JSON-RPC execution tests.
