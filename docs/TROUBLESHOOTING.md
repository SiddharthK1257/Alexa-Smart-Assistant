# TROUBLESHOOTING GUIDE — ALEXA+ SMART ASSISTANT
**Application:** Alexa+ Smart Assistant (Supabase Edition)  

---

## 1. Common Issues & Solutions

### 1.1 Microphone Permission Denied or Not Working
* **Symptom:** Clicking the microphone orb displays `"Microphone error: not-allowed"` or no transcription appears.
* **Cause:** The browser blocked microphone access, or the site is loaded over insecure HTTP (browsers require HTTPS or `localhost` for `webkitSpeechRecognition`).
* **Fix:**
  1. Ensure you are accessing via `http://localhost:5173` or a valid HTTPS URL.
  2. Click the lock/tune icon in the browser address bar, navigate to **Site Settings > Microphone**, and change to **Allow**.
  3. You can always use the text input bar as a 100% reliable fallback.

---

### 1.2 "Gemini Assistant API unavailable or timed out" (Fallback Mode)
* **Symptom:** Assistant responses state: *"I'm currently operating in fallback mode"* or server logs show `[503 Service Unavailable] This model is currently experiencing high demand`.
* **Cause:** Upstream Google Gemini API spikes or rate limiting.
* **Fix:**
  * The backend features an **Intelligent Deterministic Fallback Router** in `backend/src/services/gemini.ts`. Even if the upstream Gemini API times out, natural language intents for creating tasks, scheduling reminders, checking notes, and reporting system status are automatically parsed and executed directly against Supabase!
  * Verify your `GEMINI_API_KEY` at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
  * Ensure `GEMINI_MODEL=gemini-3.8-flash` is set in `.env`.

---

### 1.3 Database Migration Fails or "relation already exists"
* **Symptom:** `npm run db:migrate` fails with an SQL syntax or connection error.
* **Cause:** Incorrect `DATABASE_URL` password encoding or network firewall blocking port 5432.
* **Fix:**
  1. Ensure `DATABASE_URL` in `.env` matches:
     `postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres`
  2. If your database password contains special characters (e.g. `@`, `#`, `?`), ensure it is URL-encoded.
  3. Ensure your network allows outbound connections to port 5432.

---

### 1.4 Supabase Row Level Security (RLS) Blocks Access
* **Symptom:** Query returns empty array `[]` or error `new row violates row-level security policy for table`.
* **Cause:** The request does not contain a valid Bearer token for an authenticated user, or the token belongs to a different user.
* **Fix:**
  * Click **"Instant Demo"** in the top navigation bar to authenticate with the pre-seeded account.
  * In code, ensure you pass the Supabase session access token via the `Authorization: Bearer <token>` header.

---

### 1.5 Amazon Alexa+ Account Linking Fails (Invalid Grant)
* **Symptom:** Alexa+ Developer Simulator fails during account linking step.
* **Cause:** Mismatched `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, or PKCE code verifier mismatch.
* **Fix:**
  1. Check `backend/src/oauth/alexaOAuth.ts` logs for authorization code lifecycle.
  2. Ensure the redirect URI registered in Amazon matches `OAUTH_REDIRECT_URI` in `.env`.
  3. Verify that `code_challenge_method=S256` is enabled in the Amazon Alexa+ console.

---

### 1.6 Speech Synthesis Voices Sound Robotic or Do Not Speak
* **Symptom:** Browser text-to-speech output is silent or low quality.
* **Fix:**
  * Check if the voice toggle pill below the Alexa Orb is set to **"Voice Muted"**. Click it to toggle to **"Voice Active"**.
  * Adjust speech rate in `/app/settings` (recommended: `1.0x` natural speed).
  * Modern browsers load natural neural voices asynchronously (`window.speechSynthesis.onvoiceschanged`); the application automatically selects high-definition neural voices (e.g. Google US English, Samantha, Jenny, Aria).

---

## 2. Supabase Authentication Diagnostics & Configuration

### 2.1 The Email Authentication Bug & Resolution
* **Root Causes Identified:**
  1. **Missing GoTrue Identity Records in SQL Seed:** The original seed migration inserted records into `auth.users` via raw SQL with default bcrypt rounds 6 and omitted corresponding entries in `auth.identities`. This caused Supabase GoTrue Auth to fail with internal `500 Database error querying schema`.
  2. **Supabase Free Tier Email Send Rate Limits (`429 over_email_send_rate_limit`):** By default, Supabase's built-in email provider limits projects without custom SMTP to ~3-4 emails per hour. When users entered their email to register or request magic-link/OTP, Supabase rejected the request with `email rate limit exceeded`.
  3. **Missing Multi-Mode UI & Route Guards:** The original UI lacked password show/hide, forgot password handling, 6-digit OTP verification inputs, and route protection, leaving unauthenticated users on broken views with 401 errors.
* **Resolution Implemented:**
  1. Updated `supabase/migrations/20261021000002_seed_dev_data.sql` to generate standard bcrypt rounds 10, populated `confirmation_token`, `recovery_token`, `email_change_token_new`, `email_change` with valid empty strings, and added matching `auth.identities` records.
  2. Verified active passwords on both pre-seeded accounts so users and judges can authenticate immediately without hitting external email quotas.
  3. Built a multi-mode `AuthModal.tsx` supporting Email & Password sign-in, Register, Passwordless OTP, Code Verification, and Forgot Password recovery.
  4. Added `ProtectedRoute.tsx` guards protecting `/app/*` routes from unauthorized access.

### 2.2 Verified Pre-seeded Test Accounts
The following accounts are pre-seeded and verified with active passwords:

| Email | Password | Display Name | Role | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `alexa.demo@example.com` | `AlexaDemo2026!` | Alexa Demo User | Authenticated | Instant Demo access & evaluation |
| `siddharthtiwary012@gmail.com` | `AlexaDemo2026!` | Siddharth Kumar | Authenticated | Primary workspace developer account |

### 2.3 Supabase Dashboard Settings Required for Custom Domains
When deploying or reconfiguring the Supabase project:
1. **Site URL:**
   * Navigate to **Authentication > URL Configuration > Site URL**.
   * Development: `http://localhost:5173`
   * Production: `https://your-production-domain.com`
2. **Redirect URLs:**
   * Add:
     - `http://localhost:5173/**`
     - `http://localhost:4000/**`
     - `https://your-production-domain.com/**`
3. **Custom SMTP (To Remove Email Rate Limits):**
   * If you wish to enable high-volume passwordless magic links or email confirmations, navigate to **Project Settings > Authentication > SMTP Settings** and configure a custom provider (e.g., Resend, SendGrid, Amazon SES). This eliminates the 3-email/hr limit.
4. **Email Confirmation Toggle:**
   * Under **Authentication > Providers > Email**, you can toggle "Confirm email" off for local sandbox testing, allowing users to register and sign in immediately.
