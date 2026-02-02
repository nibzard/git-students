# Git & GitHub Basics Test

A simple, timed quiz for students. Only `@pmfst.hr` emails are allowed.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local`:
   ```bash
   TURSO_DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-token
   ```
3. Run the app:
   ```bash
   npm run dev
   ```

## Deploy (Vercel)

- Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to Vercel project env vars.
- Deploy as a standard Next.js app.

## Database

Schema is auto-created on first request. Tables:
- `sessions`
- `answers`
