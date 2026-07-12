# SiteBank — Client demo runbook

Two paths to demo: **local** (laptop, faster) and **cloud** (shareable URL, more impressive).

---

## Path A — Local demo (5 min setup, runs on your laptop)

### Prerequisites (one-time)
```bash
# Postgres + Redis
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis

# Node + pnpm (if not already)
brew install node@20
npm install -g pnpm@9

# Database
createuser -s sitebank
createdb -O sitebank sitebank
psql -d sitebank -c "ALTER USER sitebank WITH PASSWORD 'sitebank';"
```

### Start the demo
```bash
cd /Users/ganeshvaradi/Developer/SiteBank
pnpm install
cp .env.example .env                 # already done — keys filled in
pnpm --filter api db:migrate:prod    # or db:migrate for dev migrations
pnpm --filter api db:seed            # creates demo properties, leads, analytics

# Two terminals (or use tmux):
pnpm --filter api dev                # API on :4000
pnpm --filter web dev                # Web on :3000
```

Open http://localhost:3000.

### Demo credentials
| Role        | Email                  | Password               | What to show                      |
|-------------|------------------------|------------------------|-----------------------------------|
| Agent       | `demo@sitebank.in`     | `Demo@2026`            | Main demo flow — populated data   |
| Agency      | `agency@sitebank.in`   | `Agency@2026`          | Agency multi-user, branding       |
| Super-admin | `admin@sitebank.in`    | `SiteBank@Admin2026!`  | Platform stats, suspend, verify   |

### What's seeded
- **6 properties** across Hyderabad/Bangalore (apartments, villa, plot, commercial, etc.)
- **6 smart links** with 30-day analytics history (~750 events)
- **12 leads** distributed across all status pivots
- **4 follow-up reminders** within the next week

---

## Suggested 8-minute demo flow

| Time | What to show | URL |
|------|--------------|-----|
| 0:00 | Login as `demo@sitebank.in` | `/login` |
| 0:30 | Dashboard — KPIs, sparkline, funnel, top properties | `/dashboard` |
| 1:30 | Properties list — search, filter, status badges | `/properties` |
| 2:00 | Drill into one property — verified badge, status workflow | `/properties/[id]` |
| 2:30 | Edit property → Media tab — drag-drop image (demo upload) | `/properties/[id]/edit?step=media` |
| 3:30 | Smart Links page — copy a link, show "regenerate slug" | `/smart-links` |
| 4:00 | **Open the public page in incognito** — this is the buyer experience | `/p/demo-prop-1` |
| 5:00 | Submit the lead form on the public page | (form on `/p/demo-prop-1`) |
| 5:30 | Back to agent — Leads page, see the new lead, hot-score, status workflow | `/leads` |
| 6:30 | Lead detail — notes auto-save, reminders, click-to-WhatsApp | `/leads/[id]` |
| 7:00 | Analytics — switch property, see referrers + scroll depth | `/analytics` |
| 7:30 | Settings — show plan grid, AI features per plan | `/settings` |

### Highlight-reel features for the client
1. **Smart links generate WhatsApp-shareable URLs** with proper OG previews
2. **Lead capture happens on the buyer page**, no app install needed
3. **Hot-score** prioritizes leads automatically (rule-based, transparent)
4. **Sub-second analytics** with real-time live counter
5. **AI title/description** via DeepSeek (Pro plan) — `POST /ai/property/:id/title`
6. **Multi-tenant** — agency owners can have a team
7. **Plan-gated features** — Free/Basic/Pro/Agency tiers enforced server-side

---

## Path B — Cloud demo (shareable URL)

For a URL the client can open from anywhere. Easiest stack: **Neon (Postgres) + Upstash (Redis) + Vercel (web) + Render (API)**, all free tier.

### 1. Database — Neon (5 min)
1. Go to https://neon.tech, sign up, create project "sitebank"
2. Copy connection string → set as `DATABASE_URL`
3. From your laptop: `cd apps/api && DATABASE_URL=<url> pnpm db:migrate:prod && pnpm db:seed`

### 2. Redis — Upstash (3 min)
1. https://upstash.com, create Redis DB
2. Copy `redis://...` URL → `REDIS_URL`

### 3. API — Render (10 min)
1. https://render.com, New → Web Service → Connect your GitHub repo
2. Settings:
   - Root: `apps/api`
   - Build: `pnpm install --frozen-lockfile && pnpm --filter api db:generate && pnpm --filter api build`
   - Start: `pnpm --filter api start`
   - Health check path: `/health`
3. Env vars: paste everything from `.env`, plus `NODE_ENV=production`
4. Deploy — note the URL (e.g. `https://sitebank-api.onrender.com`)

### 4. Web — Vercel (5 min)
1. https://vercel.com, Import GitHub repo
2. Root directory: `apps/web`
3. Env vars:
   - `NEXT_PUBLIC_API_URL=https://sitebank-api.onrender.com/api/v1`
   - `NEXT_PUBLIC_APP_URL=https://<your-vercel-url>.vercel.app`
4. Deploy — share the Vercel URL with the client

### 5. Update API CORS
Set on Render: `FRONTEND_URL=https://<your-vercel-url>.vercel.app` and redeploy.

---

## Common issues

**"Cannot connect to localhost:4000"** — API didn't start. Check `tail -f /tmp/api-dev.log`.

**"Property limit reached on current plan"** — demo agent is on Pro (100 properties) so this shouldn't happen. If it does, run `pnpm --filter api db:seed` again to reset.

**Public smart-link page returns 410** — link is expired or disabled. Use `/p/demo-prop-1` through `/p/demo-prop-6`.

**AI buttons return 503** — DeepSeek key missing. It's pre-filled in `.env` from the openclaw config.

**Photo uploads fail** — S3 not configured. For local demo, photos use seeded Unsplash URLs and uploads silently fail; that's OK to skip in the demo. For cloud, configure S3/R2/B2 (see `.env.example`).

---

## Reset / restart

```bash
# Reset database to fresh seeded state
pnpm --filter api db:reset      # destroys data + re-runs migrations
pnpm --filter api db:seed

# Restart services
brew services restart postgresql@16
brew services restart redis
```
