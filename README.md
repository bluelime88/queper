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

## Billing (Stripe)

Free plan = **10 orders/queue per day** (enforced by a DB trigger, so it can't be
bypassed from the client). **Monthly $5** and **Annual $50** remove the limit.

1. Create a [Stripe](https://stripe.com) account (test mode is fine).
2. **Products** → create one product with two recurring prices: **$5 / month** and **$50 / year**. Copy both **price IDs** (`price_…`).
3. **Developers → API keys** → copy the **Secret key** (`sk_…`).
4. **Developers → Webhooks** → add endpoint `https://<your-domain>/api/stripe/webhook`, subscribe to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the **Signing secret** (`whsec_…`).
5. Put all four (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`) in `.env.local` and in Vercel env vars.
6. Run [`supabase/subscription.sql`](./supabase/subscription.sql) in the Supabase SQL editor (adds subscription columns + the daily-limit trigger).

Local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (its printed `whsec_…` is your local `STRIPE_WEBHOOK_SECRET`).

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
