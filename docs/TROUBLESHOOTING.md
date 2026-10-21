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
