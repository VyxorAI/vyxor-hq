# Vyxor HQ

Internal operating system for the two Vyxor AI founders: leads, clients, projects and tasks. See [SPEC.md](SPEC.md) for the full brief.

React + Vite + TypeScript, Tailwind CSS, TanStack Query, dnd-kit, Supabase. Hosted on Netlify.

## Run locally

1. Copy `.env.example` to `.env` and fill in the Supabase project URL and publishable (anon) key.
2. Install and start:

   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:5173 and sign in with a founder account.

## Database

SQL migrations live in `supabase/migrations/` and are run in order in the Supabase SQL editor (one new query per file). Sign-ups are disabled in Supabase Auth; founder accounts are created in the dashboard.

## Deploy

Netlify builds every push to `main` using `netlify.toml`. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Netlify's environment variables. Never commit `.env`.
