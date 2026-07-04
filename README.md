# ClubSync

ClubSync helps parents discover, plan, and coordinate children's clubs and activities with trusted parent friends. MVP focuses on summer camps around New Malden and South West London.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS 4** + shadcn/ui
- **Supabase Auth** + PostgreSQL
- **Prisma ORM**
- **TanStack Query**, Zustand, React Hook Form, Zod
- **FullCalendar**, MapLibre GL JS
- **PWA** via Serwist
- **Vitest** + **Playwright**

## Prerequisites

- Node.js 20+
- npm
- A free [Supabase](https://supabase.com) account

## Supabase Setup

1. **Create a project** at [supabase.com/dashboard](https://supabase.com/dashboard)
   - Choose **EU West (London)** region for UK users
2. **Enable Email auth**
   - Authentication → Providers → Email → Enable
3. **Copy credentials** from Project Settings → API:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
4. **Copy database URLs** from Project Settings → Database:
   - Connection string (URI) → `DIRECT_URL` (port 5432)
   - Connection pooling (Transaction mode) → `DATABASE_URL` (port 6543, add `?pgbouncer=true`)
5. **Configure redirect URLs** (Authentication → URL Configuration):
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

## Prisma 7 + Supabase

ClubSync uses Prisma 7 with the PostgreSQL adapter (`@prisma/adapter-pg`). Ensure `DATABASE_URL` uses the **pooled** connection string (port 6543) and `DIRECT_URL` uses the direct connection (port 5432) for migrations.


```bash
# Clone and install
cd campsync
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Apply schema and seed data (Phase 2)
npm run db:migrate
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Phase 2: Data Model

Phase 2 sets up the full Prisma schema, migrations, seed data, Zod validation, and core server actions.

```bash
# Apply migrations (uses DIRECT_URL from .env.local)
npm run db:migrate

# Seed SW London camp data
npm run db:seed

# Verify data layer (counts, filters, upsert logic)
npm run db:verify

# Browse data in Prisma Studio
npm run db:studio
```

### What the seed creates

- 10 providers and 35 summer camps across New Malden, Kingston, Wimbledon, Surbiton, Worcester Park, Raynes Park, Epsom, Sutton, and Richmond
- Demo parent accounts (`parent1@example.com`, `parent2@example.com`) with children, planned camps, trusted connections, shared camps, and ratings
- An admin user (`admin@example.com`) for local DB testing

**Note:** Seed users exist in Postgres only. Create real accounts via Supabase Auth to log in. Set `ADMIN_EMAIL` in `.env.local` to assign admin role on first login.

### Production migrations

```bash
npm run db:migrate:deploy
```

### Next step

Phase 5 adds social sharing: invite links, trusted parent connections, friend activity, and shared camps.

## Phase 5: Social Sharing

Phase 5 connects parents with trusted friends and coordinates shared camp plans:

- **Invite links** — generate a secure token, copy link, or share via WhatsApp (`/invite/[token]`)
- **Trusted connections** — manage sent/received connections on the Friends page
- **Friend activity** — privacy-safe feed on Home, Friends, and camp detail (nicknames only; cancelled camps hidden)
- **Shared camps** — create from camp detail, list on Friends, join existing groups, view participant statuses

```bash
# Create an invite at /friends
# Accept via /invite/[token] after signing in
# Create or join a shared camp from /camps/[id]
# View coordination at /shared-camps/[id]
```

## Phase 6: Admin

Phase 6 delivers the role-guarded admin portal:

- **Dashboard** — overview with pending moderation counts
- **Camp CRUD** — create, edit, and archive camps
- **Provider CRUD** — manage camp providers
- **Submissions** — approve (creates a draft camp) or reject parent submissions
- **Change requests** — approve (patches camp field) or reject
- **Ratings moderation** — approve/reject with automatic rating recalculation

```bash
# Set ADMIN_EMAIL in .env.local, sign up with that email
# Open /admin after login
```

## Phase 7: Quality

Phase 7 polishes the MVP for production readiness:

- **Responsive polish** — mobile-first layout with bottom nav and desktop sidebar
- **Accessibility** — skip link, form labels, focus states, aria labels on actions
- **Empty/loading/error states** — dashboard and admin skeleton/error boundaries
- **Tests** — Vitest for scoring, privacy, invite tokens; Playwright for auth, invite, and route guards
- **Deployment guide** — Vercel + Supabase checklist below

```bash
npm test
npm run test:e2e
npm run build
```

## Phase 3: Parent Experience

Phase 3 delivers the parent-facing discovery and planning flow:

- **Profile onboarding** — parent profile with postcode geocoding (postcodes.io), child CRUD with privacy-safe fields
- **Discover** — search, filters (age, activity, dates, price, rating, distance, indoor/outdoor, friends-only), camp cards
- **Camp detail** — full camp info, map, planning status controls, ratings, change requests
- **Recommendations** — rules-based scoring engine on Home and Smart Planner (`lib/recommendations/score-camps.ts`)

```bash
# Log in, complete profile at /profile?onboarding=true
# Browse camps at /discover
# View camp detail at /camps/[id]
# Try Smart Planner at /planner
```

## Phase 4: Calendar and Map

Phase 4 adds visual planning views:

- **Calendar** — FullCalendar month view with multi-day camp blocks; bottom sheet detail drawer with status controls
- **Map** — MapLibre GL map on Discover, Home snapshot, and camp detail; marker styles for mine, friend, shared, and suggested camps
- **Filter sync** — Discover filters persist in URL search params and Zustand store (`lib/stores/discover-store.ts`)
- **Calendar preview** — Discover page shows filtered camps on a mini calendar

```bash
# View your planned camps at /calendar
# Use map + calendar preview on /discover
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (preferred) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy anon key (also supported) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `DATABASE_URL` | Pooled Postgres URL (port 6543) |
| `DIRECT_URL` | Direct Postgres URL (port 5432) |
| `NEXT_PUBLIC_APP_URL` | App base URL |
| `ADMIN_EMAIL` | Email that receives admin role on signup |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run db:push` | Push Prisma schema to database (dev shortcut) |
| `npm run db:migrate` | Apply migrations in development |
| `npm run db:migrate:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed SW London camp data |
| `npm run db:verify` | Verify Phase 2 data layer against seeded DB |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
app/
  (auth)/          Login & signup
  (dashboard)/     Home, Discover, Calendar, Friends, Profile, Planner
  admin/           Admin portal (role-guarded)
  invite/[token]/  Trusted parent invite acceptance
components/        UI, layout, camp, calendar, map, friends, admin
lib/
  actions/         Server actions
  auth/            Supabase SSR helpers
  db/              Prisma client
  recommendations/ Rules-based scoring engine
  privacy/         Friend visibility helpers
  validation/      Zod schemas
prisma/            Schema + seed data
tests/             Unit + E2E tests
```

## Features

### Parent
- Browse and filter local summer camps
- Map and calendar views
- Plan camps with status tracking (interested → paid)
- Invite trusted parents via shareable link
- See friend camp activity (privacy-safe)
- Create/join shared camps
- Rate camps
- Rules-based recommendations

### Admin
- Camp and provider CRUD
- Moderate parent submissions and change requests
- Moderate ratings

### Privacy
- Child profiles use nickname only — no full name, DOB, photo, or address
- Trusted parents see camp activity and nicknames only
- Private child notes never shared with friends

## PWA

ClubSync is installable as a PWA. The service worker caches the app shell for offline access. Install via browser "Add to Home Screen" on mobile.

## Testing

```bash
# Unit tests
npm test

# E2E (starts dev server automatically)
npm run test:e2e
```

## Deployment (Vercel)

1. Push repo to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set all environment variables from `.env.example`
4. Use the **pooled** `DATABASE_URL` for serverless
5. Add production URL to Supabase redirect URLs
6. Deploy — run `npx prisma migrate deploy` or `db:push` against production DB

### Production checklist

- [ ] Supabase production project configured
- [ ] All env vars set in Vercel
- [ ] `ADMIN_EMAIL` set to your admin account
- [ ] Redirect URLs updated for production domain
- [ ] Database schema pushed/migrated
- [ ] Seed data loaded (or import real camp data)
- [ ] PWA install tested on mobile

## Seed Data

The seed script creates:
- 10 providers
- 35 camps across New Malden, Kingston, Wimbledon, Surbiton, Worcester Park, Raynes Park, Epsom, Sutton, Richmond
- Demo parent accounts (for local DB testing only — create real accounts via Supabase Auth)
- Sample planned camps, trusted connections, shared camps, and ratings

## Roadmap

- Phase 8+: Real camp data import/scraping
- Full Smart Planner automation
- Multi-region expansion
- Chat/coordination messaging
- SEND and accessibility filter implementation

## License

Private — MVP prototype.
