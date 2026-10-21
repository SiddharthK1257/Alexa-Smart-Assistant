# COMPONENT INVENTORY — ALEXA+ SMART ASSISTANT
**Document:** `design/COMPONENT_INVENTORY.md`  
**Framework:** React 18 / TypeScript / Tailwind CSS / Framer Motion  

---

## 1. Atoms & Primitives

### 1.1 `Button`
* **Variants:**
  * `primary`: Gradient `from-cyan-500 to-blue-600`, black bold text, hover glow.
  * `secondary`: Background `#1F2937`, border `#374151`, text gray 200.
  * `ghost`: Transparent background, hover background `#1F2937`, text gray 400.
  * `danger`: Background `rgba(239, 68, 68, 0.15)`, text red 400, border red 500/30.
* **Sizes:** `sm` (px-2.5 py-1 text-xs), `md` (px-4 py-2 text-xs), `lg` (px-6 py-3 text-sm).
* **Props:** `isLoading`, `icon`, `disabled`, `onClick`.

### 1.2 `StatusBadge`
* **Variants:** `success` (emerald), `warning` (amber), `error` (red), `info` (blue), `neutral` (gray).
* **Elements:** Dot indicator + text label.

### 1.3 `Input` & `Textarea`
* **Variants:** Standard dark input, with optional leading icon (search, mail, lock) and trailing clear button.

---

## 2. Molecules

### 2.1 `AlexaRing` (Orb)
* **States:**
  * `idle`: Soft cyan breathing ambient pulse.
  * `listening`: Active cyan glow with 5-bar animated audio equalizer waveform.
  * `processing`: Violet/purple rotating spinner symbolizing Gemini AI tool reasoning.
  * `speaking`: Blue modulated pulse corresponding to browser speech synthesis.
* **Controls:** Voice input button, mute toggle pill.

### 2.2 `ChatMessageBubble`
* **Variants:**
  * `user`: Right-aligned gradient card (`from-cyan-600 to-blue-700`).
  * `assistant`: Left-aligned elevated card (`#111827`) with markdown rendering.
  * `error`: Red-tinted card with actionable error details.
* **Accessories:** Timestamp, speak button, collapsible `ToolExecutionCard`.

### 2.3 `ToolExecutionCard`
* **Header:** Tool name (`create_task`, `create_reminder`, etc.), status badge (`success`/`failure`), accordion chevron.
* **Content:** Arguments JSON payload and resulting database record preview.

### 2.4 `TaskCard`
* **Elements:** Interactive checkbox, title, multiline description, priority badge (`low`, `medium`, `high`, `urgent`), due date calendar tag, and delete action.

### 2.5 `ReminderCard`
* **Elements:** Bell icon, reminder text, formatted scheduled timestamp, dismiss check button, delete action.

### 2.6 `NoteCard`
* **Elements:** Note title, markdown content snippet, tag pill list (`#tag`), last updated timestamp, delete action.

---

## 3. Organisms & Layouts

### 3.1 `HeaderNav`
* **Brand:** Glowing Alexa+ logo with "Supabase MCP Edition" badge.
* **Navigation Links:** Assistant, Tasks, Reminders, Notes, Activity, MCP, Settings.
* **User Profile & Auth:** Display name, Supabase connection status dot, Sign In / Sign Out triggers.

### 3.2 `ConversationSidebar`
* **Actions:** "New Conversation" button.
* **History Feed:** List of user's past chats with active indicator, inline rename, and delete triggers.

### 3.3 `AuthModal`
* **Tabs:** Sign In vs Create Account.
* **One-Click Demo:** Instant demo login with pre-seeded test credentials.
* **Form:** Input validation, error toasts, and smooth Framer Motion entrance.

### 3.4 `LandingPage`
* **Sections:** Hero headline, interactive assistant orb preview, 3 Bento feature cards, 3-step workflow diagram, security assurance, responsive footer.

### 3.5 `SettingsView`
* **Sections:** User profile information, speech synthesis rate slider, speech voice selector, theme preferences, and MCP endpoint specs.

### 3.6 `ActivityLogView`
* **Sections:** Chronological audit log table, status filtering, details payload viewer.
