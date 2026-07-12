# SiteBank

Property listing & smart-link platform for real-estate agents and agencies in India.
Agents create properties, generate AI-titled microsites with shareable links, capture leads,
track engagement analytics, and manage subscriptions.

## Stack

- **API** — NestJS 10, Prisma 5 + PostgreSQL, Redis (BullMQ + throttler), JWT + Google OAuth,
  S3-compatible object storage, Pino structured logging, Swagger.
- **Web** — Next.js 14 (App Router), React Query, Tailwind, shadcn-style UI.
- **AI** — DeepSeek (OpenAI-compatible) for property titles, descriptions, Q&A.
- **Payments** — Razorpay subscriptions.
- **Notifications** — Resend (email) + WhatsApp Cloud API.
- **Monorepo** — pnpm workspaces + Turbo.

## Quick start (local dev)

### 1. Environment Setup
Create a `.env` file from the example template and fill in any required secrets:
```bash
cp .env.example .env
```
*(At minimum, ensure `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` are set).*

### 2. Install & Start Infrastructure
```bash
pnpm install
# Start PostgreSQL, Redis, and MinIO in the background
docker compose up -d postgres redis minio
```

### 3. Database Initialization
Run the database migrations and seed it with demo data:
```bash
pnpm --filter api db:migrate
pnpm --filter api db:seed
```

### 4. Run the Site (Frontend + Backend)
Start both the Next.js frontend and NestJS backend concurrently:
```bash
pnpm dev
```

### Accessing the Site

- **Web App (Frontend)**: [http://localhost:3000](http://localhost:3000)
- **API (Backend)**: [http://localhost:4000](http://localhost:4000)
- **API Docs (Swagger)**: [http://localhost:4000/docs](http://localhost:4000/docs)
- **Healthcheck**: [http://localhost:4000/health](http://localhost:4000/health)

#### Test Credentials (from database seed):
- **Agent**: `demo@sitebank.in` / `Demo@2026`
- **Agency**: `agency@sitebank.in` / `Agency@2026`
- **Admin**: `admin@sitebank.in` / `SiteBank@Admin2026!`

> **Note**: For comprehensive details regarding the frontend's tech stack, features, and isolated running instructions, see the [Web App Documentation](./apps/web/README.md).

## Production

```bash
docker compose up --build           # builds api + web images and runs full stack
```

CI runs typecheck, lint, tests, and Docker image builds on every push to `main`.

## Layout

```
apps/
  api/    NestJS backend
  web/    Next.js frontend
packages/
  types/  shared TS types
```

## Required environment

See `.env.example`. Minimum for the API to boot: `DATABASE_URL`, `JWT_SECRET`,
`JWT_REFRESH_SECRET`. External integrations (email, payments, WhatsApp) are
feature-flagged off by default.
