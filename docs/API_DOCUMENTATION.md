# API DOCUMENTATION — ALEXA+ SMART ASSISTANT
**Application:** Alexa+ Smart Assistant (Supabase Edition)  
**Base URL:** `http://localhost:4000` (or production HTTPS domain)  
**Authentication:** Bearer token (Supabase Auth JWT or Alexa+ OAuth 2.1 Access Token)  

---

## 1. System & Protocol Endpoints

### 1.1 `GET /health` & `GET /api/health`
Checks backend uptime, Supabase PostgreSQL pool connectivity, registered MCP tool count, and active Gemini model.
* **Headers:** None required.
* **Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-10-21T10:45:00.000Z",
  "service": "Alexa+ Smart Assistant Backend",
  "environment": "development",
  "database": {
    "status": "healthy",
    "engine": "Supabase PostgreSQL",
    "latencyMs": 42
  },
  "mcp": {
    "status": "operational",
    "transport": "Streamable HTTP",
    "endpoint": "/mcp",
    "toolsCount": 8
  },
  "aiModel": "gemini-3.8-flash"
}
```

---

### 1.2 `GET /mcp/tools`
Lists all 8 MCP tools and their descriptions.
* **Headers:** None required.
* **Response (200 OK):**
```json
{
  "tools": [
    { "name": "create_task", "description": "Create a new personal task..." },
    { "name": "list_tasks", "description": "List personal tasks..." },
    { "name": "update_task", "description": "Update an existing task..." },
    { "name": "create_reminder", "description": "Schedule a reminder message..." },
    { "name": "list_reminders", "description": "List scheduled reminders..." },
    { "name": "save_note", "description": "Save or create a personal note..." },
    { "name": "search_notes", "description": "Search personal notes..." },
    { "name": "get_assistant_status", "description": "Get real-time operational status..." }
  ]
}
```

---

### 1.3 `POST /mcp/execute`
Executes an MCP tool with authenticated user isolation.
* **Headers:** `Authorization: Bearer <token>`
* **Body:**
```json
{
  "tool": "create_task",
  "arguments": {
    "title": "Review security audit logs",
    "priority": "high"
  }
}
```
* **Response (200 OK):** Returns created or queried database record.

---

## 2. AI Assistant Endpoint

### 2.1 `POST /api/assistant/chat`
Processes conversational voice/text input via Gemini function calling and automatic Supabase tool execution. Automatically saves chat message to conversation history.
* **Headers:** `Authorization: Bearer <token>`
* **Body:**
```json
{
  "message": "Add a task to buy groceries tomorrow",
  "conversationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help you today?" }
  ]
}
```
* **Response (200 OK):**
```json
{
  "response": "I have created the task \"buy groceries\" for you.",
  "conversationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "toolExecutions": [
    {
      "name": "create_task",
      "args": { "title": "buy groceries", "priority": "medium" },
      "result": { "id": "uuid", "title": "buy groceries", "status": "pending" },
      "status": "success",
      "timestamp": "2026-10-21T10:45:00.000Z"
    }
  ],
  "followUpSuggestions": [
    "View all my tasks",
    "Set a reminder for this task"
  ]
}
```

---

## 3. Conversations & Messages Endpoints

* `GET /api/conversations`: Returns user's chat sessions ordered by `updated_at DESC`.
* `POST /api/conversations`: Creates a new conversation `{ "title": "..." }`.
* `GET /api/conversations/:id`: Returns conversation details and all associated messages.
* `PATCH /api/conversations/:id`: Renames conversation `{ "title": "..." }`.
* `DELETE /api/conversations/:id`: Deletes conversation and cascades messages.
* `GET /api/conversations/:id/messages`: Retrieves messages for conversation.
* `POST /api/conversations/:id/messages`: Adds message to conversation.

---

## 4. Tasks Endpoints

* `GET /api/tasks?status=pending&priority=high`: Lists user's tasks.
* `POST /api/tasks`: Creates a task `{ "title": "...", "description": "...", "priority": "high", "due_date": "ISO" }`.
* `GET /api/tasks/:id`: Gets single task.
* `PATCH /api/tasks/:id`: Updates task fields.
* `DELETE /api/tasks/:id?confirm=true`: Deletes task.

---

## 5. Reminders Endpoints

* `GET /api/reminders?status=scheduled`: Lists reminders.
* `POST /api/reminders`: Schedules reminder `{ "message": "...", "scheduled_time": "ISO" }`.
* `GET /api/reminders/:id`: Gets single reminder.
* `PATCH /api/reminders/:id`: Updates reminder (e.g. `{ "status": "dismissed" }`).
* `DELETE /api/reminders/:id?confirm=true`: Deletes reminder.

---

## 6. Notes Endpoints

* `GET /api/notes?limit=30`: Lists notes.
* `GET /api/notes/search?query=mcp&tag=architecture`: Full-text & tag search.
* `POST /api/notes`: Creates note `{ "title": "...", "content": "...", "tags": ["tag1"] }`.
* `GET /api/notes/:id`: Gets note by ID.
* `PATCH /api/notes/:id`: Updates note content or tags.
* `DELETE /api/notes/:id?confirm=true`: Deletes note.

---

## 7. Audit & Security Trail Endpoints

* `GET /api/audit?limit=25`: Returns cryptographic audit trail of user's tool calls and events.

---

## 8. User Profile Endpoints

* `GET /api/profile`: Returns profile and preferences.
* `PATCH /api/profile`: Updates profile display name or voice preferences.
