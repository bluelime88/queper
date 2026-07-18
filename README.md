# Queper

Web-based, QR-powered digital queue notifications. No app, no account, no personal info.
Built on Next.js (App Router) + Supabase, deployable to Vercel.

Product spec: [`Queper.md`](./Queper.md).

## Stack
- **Next.js 14** (App Router) — pages + serverless API routes. Vercel-native.
- **Supabase** — Postgres, Auth (staff), Realtime (live dashboard), Row-Level Security (business data isolation).
- **Web Push (VAPID)** — customer notifications via a service worker.

Real-time runs client ↔ Supabase (not through the server), so it works on Vercel's
serverless model. Anonymous customer flows go through API routes using the service-role
key; staff flows use the browser client under RLS.

## Setup

### 1. Supabase project
1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → paste and run [`supabase/schema.sql`](./supabase/schema.sql).
3. **Authentication → Providers → Email → turn OFF "Confirm email"** (lets staff sign up and use the dashboard instantly for the MVP). Leave on if you want email confirmation.
4. **Authentication → URL Configuration**: set **Site URL** to your deployed URL (e.g. `https://queper.vercel.app`) and add these to **Redirect URLs**: `https://queper.vercel.app/**` and `http://localhost:3000/**`. Required for the password-reset email link to return to `/reset`.
5. Project Settings → API: copy the **Project URL**, **anon key**, and **service_role key**.

> Password reset uses Supabase's built-in email, which is rate-limited (a few per hour) and meant for testing. Configure custom SMTP (Auth → Emails) before real use.

### 2. VAPID keys (web push)
```bash
npx web-push generate-vapid-keys
```

### 3. Environment
Copy `.env.local.example` to `.env.local` and fill in all values.

### 4. Run
```bash
npm install
npm run dev      # http://localhost:3000
```
Push notifications work on `localhost` and any HTTPS origin.

## Billing (Maya Business / PayMaya)

Free plan = **10 orders/queue per day** (enforced by a DB trigger, so it can't be
bypassed from the client). Paid plans remove the limit and are **prepaid** — a
one-time Maya Checkout buys a fixed window; access lapses back to free when it
expires unless renewed:

- **Monthly — ₱250 / 30 days**
- **Annual — ₱2,500 / 365 days**

1. In **Maya Business Manager → Developer Sandbox App Management**, generate **Sandbox API keys** (a public `pk-…` and secret `sk-…`).
2. Put them in `.env.local` and in Vercel env vars: `MAYA_ENV=sandbox`, `MAYA_PUBLIC_KEY`, `MAYA_SECRET_KEY`. (Set `MAYA_ENV=production` with live keys to go live.)
3. **Register a webhook** for `PAYMENT_SUCCESS` (and `PAYMENT_FAILED`) pointing to `https://<your-domain>/api/maya/webhook` — via Maya Manager (Settings → Webhooks) or the Create Webhook API (`POST /payments/v1/webhooks`, Basic auth with the secret key).
4. Run [`supabase/subscription.sql`](./supabase/subscription.sql) in the Supabase SQL editor (adds `plan` + `subscription_expires_at`, the `maya_payments` table, and the daily-limit trigger).

Maya webhooks are unsigned — the webhook handler re-fetches each checkout's status from Maya (secret key) before granting access, and is idempotent. Prices are in `lib/maya.js` (`PLANS`).

## Deploy to Vercel
1. Push this folder to a Git repo, import it in Vercel.
2. Add the same env vars (from `.env.local`) in **Project → Settings → Environment Variables**.
3. Deploy. Vercel serves HTTPS automatically, which web push requires.

## Try it
1. `/signup` → create a business (pick a type; sets the notification wording).
2. Dashboard → **Display QR Code** → scan with a phone (or open the printed URL).
3. Phone → enter a number → **Join Queue** → allow notifications.
4. Dashboard shows the entry live → click **Notify** → phone gets the push + the open page flips to "ready".

## Notes / known limits
- **iOS push** requires the customer to *Add to Home Screen* first (Apple restriction). Android Chrome works in-browser. The open waiting page always updates via polling as a fallback.
- **Sessions expire after 2h** (`expires_at`); a background sweep to flip stale rows to `expired` isn't scheduled yet — status is computed on read. Add a Supabase cron job if you want the DB rows updated too.
- **"Already connected" reset**: staff override UI isn't built — a second person entering an in-use number gets the PRD conflict message. Cancel + recreate for now.
- Single location per business (PRD multi-location is Phase 2).
