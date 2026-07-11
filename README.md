# Field Ledger — Supabase + deploy guide

This is a standalone, installable web app (PWA) with real user accounts and
an admin activity tracker, backed by Supabase. It's a normal Vite + React
project — deploys like any other site, no Claude-specific bits.

## 1. Create your Supabase project (free tier is fine)

1. Go to **supabase.com** → sign in → **New project**. Pick a name/region,
   set a database password (save it somewhere), and wait ~2 min for it to
   spin up.
2. Open **SQL Editor** → **New query** → paste in the entire contents of
   `supabase/schema.sql` from this folder → **Run**.
   This creates the `profiles` table, locks it down with row-level security
   (each user can only see their own data — except admins, who can see
   everyone), and auto-creates a profile row whenever someone signs up.
3. Go to **Project Settings → API**. Copy the **Project URL** and the
   **anon public** key.

## 2. Configure the app

```
cd diet-app
cp .env.example .env.local
```
Paste your Project URL and anon key into `.env.local`. This file is
git-ignored, so it never gets committed or pushed.

## 3. Make yourself an admin

1. Run the app locally (`npm install && npm run dev`) or deploy it first —
   either way, sign up for an account through the app's normal sign-up form.
2. Back in Supabase → **Table Editor → profiles**, find your row, and set
   `is_admin` to `true`.
3. Visit `/admin` in the app (e.g. `yoursite.vercel.app/admin`) — you'll now
   see every signed-up user's name, city, streak, and last-active status.

No one else can do this — the RLS policy only lets someone read every row if
their *own* `is_admin` flag is already `true`, and that flag can only be set
from the Supabase dashboard, not from the app itself.

## 4. Deploy to Vercel (free)

1. Push this folder to a GitHub repo:
   ```
   git init && git add . && git commit -m "Field Ledger"
   git branch -M main
   git remote add origin https://github.com/<you>/field-ledger.git
   git push -u origin main
   ```
2. **vercel.com** → sign in with GitHub → **New Project** → pick the repo.
3. Before deploying, add your environment variables: in the project's
   **Settings → Environment Variables**, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` with the same values from your `.env.local`.
4. Deploy. Vercel auto-detects Vite (build command `vite build`, output
   `dist`).

## What data is actually collected, and how

- **Name and city** — typed in by the person at signup. The signup screen
  says plainly that their admin will see this. Nothing is inferred or
  scraped.
- **No GPS location** — city is a free-text field the user fills in, not a
  device location capture. If you genuinely need precise geolocation later,
  that needs its own explicit permission prompt and a stronger justification
  than "so admin can see who's active."
- **Last-active / streak** — updated automatically while the app is open, so
  the admin view can show "active now" vs "gone quiet," but this is only
  ever tied to the account someone created and agreed to when signing up.
- **Everyone else's data stays hidden** — a regular user can only ever read
  or update their own row; only accounts with `is_admin = true` can see the
  full list.

## What works only once deployed (not inside a Claude artifact preview)

- **Install button** — real `beforeinstallprompt` API, Chrome/Edge/Android.
  iOS Safari has no such API (an Apple platform limit), so it shows a
  one-line "tap Share → Add to Home Screen" fallback there instead.
- **Share button** — native share sheet on mobile, copy-link on desktop.
- **Supabase auth/admin** — needs your real project URL + keys, which only
  work from a deployed domain (or `localhost` during `npm run dev`).

## Local per-device data vs. Supabase data

Daily diet/workout checklists and the weight-log chart still live in each
browser's own `localStorage`, same as before — that's normal fitness-app
behavior, not identity data. Only the **account** (name, city, streak,
last-seen) is synced to Supabase, since that's what the admin tracker needs.
If you'd rather have diet/streak history itself synced across devices too,
that's a further step — say the word and I'll wire it up.

