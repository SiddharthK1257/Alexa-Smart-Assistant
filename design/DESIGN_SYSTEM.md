# DESIGN SYSTEM — ALEXA+ SMART ASSISTANT
**Product Name:** Alexa+ Smart Assistant (Supabase Edition)  
**Version:** 1.0.0  
**Theme Philosophy:** Midnight Obsidian, Cyan Luminescence, Restrained Violet Accents  

---

## 1. Color System (Design Tokens)

The design system implements a dark-first aesthetic tailored for modern voice/AI agents, balancing deep contrast, luminous cyan indicators, and functional status tones.

### 1.1 Neutral & Background Palette
* **Background Deep (Canvas):** `#070A11` (`bg-slate-950/deep`)
* **Background Base (Surface):** `#0B0F19` (`bg-[#0B0F19]`)
* **Card Surface (Elevated 1):** `#111827` (`bg-gray-900`)
* **Input / Hover Surface (Elevated 2):** `#1F2937` (`bg-gray-800`)
* **Border Subdued:** `#1F2937` (`border-gray-800`)
* **Border Strong:** `#374151` (`border-gray-700`)
* **Border Active / Glowing:** `rgba(0, 202, 255, 0.4)` (`border-cyan-500/40`)

### 1.2 Accent & Brand Palette
* **Alexa Cyan (Primary):** `#00CAFF` (RGB: `0, 202, 255`)
* **Cyan Glow:** `rgba(0, 202, 255, 0.25)`
* **Cyan Light (Hover):** `#38BDF8` (Sky 400)
* **Electric Blue (Secondary):** `#2563EB` (Blue 600)
* **Violet Accents (AI Reasoning):** `#8B5CF6` (Violet 500)
* **Deep Purple Aura:** `#4C1D95` (Purple 900)

### 1.3 Semantic & Feedback Tokens
* **Success / Operational:** `#10B981` (Emerald 500) | Background: `rgba(16, 185, 129, 0.12)`
* **Warning / Scheduled:** `#F59E0B` (Amber 500) | Background: `rgba(245, 158, 11, 0.12)`
* **Error / Destructive:** `#EF4444` (Red 500) | Background: `rgba(239, 68, 68, 0.15)`
* **Info / Metadata:** `#60A5FA` (Blue 400) | Background: `rgba(96, 165, 250, 0.12)`

### 1.4 Typography & Text Contrast
* **Text High Contrast (Headings, Active):** `#FFFFFF` (100% white)
* **Text Primary (Body, Inputs):** `#F3F4F6` (Gray 100)
* **Text Secondary (Subtitles, Labels):** `#9CA3AF` (Gray 400)
* **Text Muted (Timestamps, Footnotes):** `#6B7280` (Gray 500)
* **Monospace Accent (JSON, MCP Tokens):** `#67E8F9` (Cyan 300)

---

## 2. Typography Scale

* **Font Family (UI):** `Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
* **Font Family (Code & MCP):** `'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace`

| Level | Size | Line Height | Weight | Letter Spacing | Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display 1** | `48px / 3rem` | `1.15` | 800 (Bold) | `-0.025em` | Marketing Hero Headline |
| **H1** | `30px / 1.875rem`| `1.25` | 700 (Bold) | `-0.02em` | Section Titles, View Headers |
| **H2** | `24px / 1.5rem` | `1.3` | 700 (Bold) | `-0.015em` | Modal Titles, Card Headings |
| **H3** | `18px / 1.125rem`| `1.4` | 600 (Semibold)| `-0.01em` | Subsection, Sidebar Items |
| **Body Large** | `16px / 1rem` | `1.5` | 400 / 500 | `0` | Lead Text, Chat Messages |
| **Body Small** | `14px / 0.875rem`| `1.5` | 400 / 500 | `0` | Dashboard Cards, Tooltips |
| **Caption** | `12px / 0.75rem` | `1.4` | 500 (Medium) | `0.01em` | Badges, Timestamps, Filters |
| **Micro / Code**| `11px / 0.6875rem`|`1.4` | 600 / Mono | `0.05em` | Protocol Badges, Token Hashes |

---

## 3. Elevation & Radius Tokens

### 3.1 Border Radius
* **`rounded-lg` (8px):** Buttons, Select Menus, Pill Badges
* **`rounded-xl` (12px):** Dashboard Widgets, Input Containers, Dropdowns
* **`rounded-2xl` (16px):** Dialog Modals, Chat Bubbles, Main Cards
* **`rounded-full` (9999px):** Orb Shell, Status Dots, Micro Buttons

### 3.2 Elevation & Shadows
* **Elevation 1 (Subtle):** `0 1px 3px rgba(0, 0, 0, 0.4)`
* **Elevation 2 (Card):** `0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)`
* **Elevation 3 (Modal / Floating):** `0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)`
* **Cyan Ambient Glow:** `0 0 35px rgba(0, 202, 255, 0.18)`
* **Listening Pulse Glow:** `0 0 50px rgba(0, 255, 234, 0.45)`

---

## 4. Motion & Microinteraction Tokens

* **Fast:** `150ms ease-out` — Hover transitions, micro scale (`active:scale-95`).
* **Medium:** `250ms cubic-bezier(0.16, 1, 0.3, 1)` — Modal entrance, tab switching, card slide-in.
* **Slow:** `400ms ease-in-out` — Ambient aura shifts, accordion expansions.
* **Spring Presets:** `type: "spring", stiffness: 350, damping: 25` for tactile buttons.
* **Accessibility:** Automatic disable of continuous scale and rotation transforms when `prefers-reduced-motion` is active.
