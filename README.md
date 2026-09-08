# Ziggadoo

What shall we do today? Dubai's kids-activities finder for parents.

Stack: Next.js (App Router, TypeScript), Tailwind, Supabase (Postgres + PostGIS), Vercel.

## Run locally

```
npm install
cp .env.example .env.local   # then fill in the anon key
npm run dev
```

## Database

Migrations live in `supabase/migrations`. `supabase/DATA_MODEL.md` explains the tables and the decisions behind them.
