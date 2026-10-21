# FIGMA DESIGN SPECIFICATION — ALEXA+ SMART ASSISTANT
**Document:** `design/FIGMA_DESIGN_SPEC.md`  
**Application:** Alexa+ Smart Assistant (Supabase Edition)  
**Target Viewports:**  
- Desktop: `1440px x 900px` (Base Canvas)
- Tablet / Small Laptop: `1024px x 768px`
- Mobile: `390px x 844px` (iPhone 14/15/16 viewport)

---

## 1. Global Layout Grid & Token Setup

* **Desktop Grid:** 12-column layout, `72px` columns, `24px` gutters, `120px` margins. Max container width: `1280px`.
* **Mobile Grid:** 4-column layout, `16px` gutters, `16px` margins.
* **Base Unit:** 4px baseline grid (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).

---

## 2. Screen-by-Screen Specifications

### Screen 1: Marketing Landing Page (`/`)
* **Hero Frame (`1440px x 720px`):**
  * Top navigation bar (`64px` height) with logo (`Alexa+`), navigation links (`Features`, `MCP Architecture`, `Security`, `Specs`), and CTA button (`Launch Assistant`).
  * Headline: "The Intelligent Assistant Built for Action." (Display 1, `48px`, Inter ExtraBold).
  * Subtitle: "Seamless voice and conversational intelligence connected directly to your personal Supabase database and Model Context Protocol (MCP) tools."
  * Hero Visual: Central interactive glowing Alexa Orb with animated soundwave rings and live speech recognition preview.
  * CTA Group: Primary "Launch Assistant", Secondary "Explore MCP Tools".
* **Feature Grid (`1440px x 600px`):**
  * 3 Bento cards:
    1. *Real Database Persistence* (Supabase PostgreSQL, RLS, zero MongoDB).
    2. *Native Model Context Protocol* (Streamable HTTP, JSON-RPC 2.0).
    3. *Gemini AI Function Calling* (Deterministic tool execution with real-time feedback).
* **How It Works (`1440px x 480px`):**
  * 3-step visual flowchart: Voice/Text Input → Gemini Intent & Tool Routing → Supabase Isolated Execution.
* **Footer (`1440px x 120px`):**
  * Disclaimer banner, RFC compliance badges, links to Privacy Policy and Terms of Use.

---

### Screen 2: Authentication Modal & Sign-In (`/auth`)
* **Dialog Container:** `440px` width, `rounded-2xl`, background `#111827`, border `#374151`.
* **Header:** Alexa+ lock icon, title, switchable tabs ("Sign In" vs "Create Account").
* **Fast-Path Feature:** "⚡ Instant Demo Login" prominent card for one-click hackathon evaluation.
* **Fields:** Full Name (if sign up), Email, Password with validation feedback.
* **States:** Normal, Focus (cyan border), Error (amber/red toast banner), Loading (spinner).

---

### Screen 3: Main Assistant Dashboard & Chat Workspace (`/app`)
* **Left Sidebar (Conversation History, `280px` desktop / overlay on mobile):**
  * "New Conversation" primary action button with `+` icon.
  * List of user's past conversations ordered by `updated_at DESC`.
  * Inline edit title and delete conversation actions.
* **Center Chat Feed:**
  * Floating top bar showing current active conversation title and Supabase connection badge.
  * Compact Alexa Orb with 7 animated voice states (`idle`, `requesting_permission`, `listening`, `processing`, `executing_tool`, `speaking`, `error`).
  * Real-time live transcript bar displaying interim and final speech recognition results with cancel/submit actions.
  * Chat messages with role differentiation (User: cyan-to-blue gradient right-aligned; Assistant: elevated dark card left-aligned).
  * Tool execution accordion showing tool name, execution timestamp, arguments JSON, and database response.
  * Suggested prompt pills for fast interactions ("List my pending tasks", "Add a reminder to drink water").
  * Voice/text input bar with speech recognition toggle button and send action.

---

### Screen 4: Tasks Manager (`/app/tasks`)
* **Header:** Title, task count badge, "New Task" modal trigger.
* **Filter Bar:** Status filter (`All`, `Pending`, `In Progress`, `Completed`), Priority filter (`All`, `Urgent`, `High`, `Medium`, `Low`).
* **Task Card Components:** Checkbox toggle for instant completion, title, description, priority badge, due date, delete button.
* **Empty State:** Subtle clock illustration with suggestion to ask Alexa verbally.

---

### Screen 5: Reminders Manager (`/app/reminders`)
* **Header:** Scheduled alert count, "New Reminder" trigger.
* **Grid:** 2-column card layout displaying reminder message, formatted countdown, and ISO timestamp.
* **Actions:** One-click "Dismiss", status indicator ("Scheduled", "Fired", "Dismissed"), and delete button.

---

### Screen 6: Notes Workspace (`/app/notes`)
* **Search Toolbar:** Full-text instant search bar + dynamic tag chips extracted from user's notes.
* **Notes Grid:** 3-column responsive grid with title, markdown body preview, tag badges (`#ai`, `#mcp`), and date.
* **Modal Editor:** Markdown title, content textarea, tag separator.

---

### Screen 7: Activity & Security Audit Trail (`/app/activity`)
* **Audit Event Feed:** Chronological table or list showing `event_type`, `tool_name`, `status` (success/failure badge), payload details, and timestamp.
* **Security Badges:** PostgreSQL Row Level Security status indicator and token issuer information.

---

### Screen 8: Settings & Account Management (`/app/settings`)
* **Profile Card:** Display name, email, avatar placeholder, user UUID.
* **Voice Preferences:** Speech synthesis rate slider (`0.75x` to `1.5x`), voice mute toggle, test voice preview button.
* **Connection Metadata:** Supabase Project ID, MCP Server Endpoint (`/mcp`), OAuth 2.1 authorization endpoint URLs.

---

### Screen 9: MCP Inspector & Developer Console (`/app/mcp`)
* **Registered Tools Tab:** Interactive playground to select any of the 8 MCP tools, edit JSON arguments, execute, and view raw JSON-RPC response.
* **System Health Tab:** Live health check status, uptime, latency, database query verification.
* **OAuth 2.1 Tab:** RFC 8414 and RFC 9470 metadata explorer for Amazon Alexa+ Add-on linking.

---

## 3. Component States & Auto-Layout Tokens

| Component | Default | Hover | Focus / Active | Disabled | Loading |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Button** | Cyan-Blue Gradient | Cyan-400 Bright | Scale `0.98` | Opacity `0.4` | Spin icon |
| **Secondary Button** | Gray 800 Surface | Gray 700 Border | Scale `0.98` | Opacity `0.4` | Spin icon |
| **Text Input** | Gray 900 / Border 700 | Border Gray 600 | Border Cyan 400 | Opacity `0.5` | Skeleton pulse |
| **Tool Pill** | Cyan 950 / Border 800 | Border Cyan 500 | Expand Accordion| N/A | Pulse animation |
| **Alexa Orb** | Idle breathing glow | Cyan ring focus | Listening waveform| Dimmed | Violet spin |
