# SiteBank Deployment Guide

> **Frontend:** Vercel → `https://site-bank2-website.vercel.app`  
> **Backend:** Render → `https://sitebank-backend.onrender.com`

---

## Phase 1: Deploy Backend on Render

### Step 1 — Create a Render Blueprint

1. Go to [render.com](https://render.com/) and sign in (or create an account).
2. Connect your **GitHub account** if you haven't already.
3. Click **New +** → **Blueprint**.
4. Select your **Site-Bank2** GitHub repository.
5. Render will auto-detect the `render.yaml` in the repo root and propose creating:
   - **sitebank-db** — PostgreSQL database (free tier)
   - **sitebank-redis** — Redis instance (free tier)
   - **sitebank-backend** — Node.js web service (free tier)
6. Click **Apply** to provision all three services.

### Step 2 — Wait for Build & Deploy

- Render will install dependencies, generate the Prisma client, build the NestJS backend, and run migrations automatically.
- The build command chain is:
  ```
  corepack enable → pnpm install → build @sitebank/types → prisma generate → nest build
  ```
- The start command is:
  ```
  prisma migrate deploy → node dist/main.js
  ```
- Monitor the **Logs** tab in the Render dashboard. A successful deploy will show:
  ```
  SiteBank API listening on :10000
  ```

### Step 3 — Note Your Backend URL

Once deployed, your backend URL will look like:
```
https://sitebank-backend.onrender.com
```
Copy this — you'll need it for the Vercel frontend env vars.

### Step 4 — Set Manual Environment Variables

Go to **Render Dashboard → sitebank-backend → Environment** and add these manually:

| Variable | Description | Required? |
|---|---|---|
| `S3_ENDPOINT` | Your S3-compatible storage endpoint (R2, AWS, etc.) | For media uploads |
| `S3_ACCESS_KEY` | Storage access key | For media uploads |
| `S3_SECRET_KEY` | Storage secret key | For media uploads |
| `S3_BUCKET` | Storage bucket name (e.g., `sitebank-media`) | For media uploads |
| `S3_REGION` | Storage region (e.g., `auto` for R2) | For media uploads |
| `S3_PUBLIC_URL` | Public CDN URL for media | For media display |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | For Google login |
| `RESEND_API_KEY` | Resend email API key | For emails |
| `RAZORPAY_KEY_ID` | Razorpay key | For payments |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | For payments |
| `SENTRY_DSN` | Sentry error tracking DSN | Optional |
| `DEEPSEEK_API_KEY` | DeepSeek AI API key | For AI features |

> **Note:** `FRONTEND_URL` is already set to `https://site-bank2-website.vercel.app` in `render.yaml`. The `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` are all auto-configured by Render.

---

## Phase 2: Deploy Frontend on Vercel

### Step 1 — Create a Vercel Project

1. Go to [vercel.com](https://vercel.com/) and sign in.
2. Click **Add New...** → **Project**.
3. Select your **Site-Bank2** GitHub repository.

### Step 2 — Configure the Project

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend/website` (click **Edit** to change) |
| **Build Command** | Leave default (uses `vercel.json`) |
| **Install Command** | Leave default (uses `vercel.json`) |

### Step 3 — Add Environment Variables

In the **Environment Variables** section before deploying, add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://sitebank-backend.onrender.com/api/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://site-bank2-website.vercel.app` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | *(your Google Maps key, if applicable)* |
| `NEXT_PUBLIC_SENTRY_DSN` | *(your Sentry DSN, if applicable)* |

### Step 4 — Deploy

Click **Deploy**. Vercel will:
1. Install dependencies using the monorepo-aware install command
2. Build the `@sitebank/types` shared package
3. Build the Next.js frontend
4. Deploy to the edge

---

## Phase 3: Verify the Connection

1. **Health check:** Visit `https://sitebank-backend.onrender.com/health` — you should see:
   ```json
   { "status": "ok", "checks": { "db": "up" } }
   ```

2. **Frontend:** Visit `https://site-bank2-website.vercel.app` — the app should load.

3. **API connection:** Open browser DevTools → Network tab, try to register or login. The API requests should go to your Render backend URL and return successfully (no CORS errors).

---

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` on Render is set to exactly `https://site-bank2-website.vercel.app` (no trailing slash).
- The backend reads this to configure `Access-Control-Allow-Origin`.

### Build Failures on Render
- Check the **Logs** tab for the build output.
- Common issue: `pnpm-lock.yaml` out of sync — run `pnpm install` locally and commit the updated lockfile.

### Build Failures on Vercel
- Ensure the **Root Directory** is set to `frontend/website`.
- Check that `@sitebank/types` builds successfully (it's a dependency of the frontend).

### Backend Sleeping (Free Tier)
- Render free tier services spin down after 15 minutes of inactivity.
- The first request after sleep takes ~30-60 seconds.
- Consider upgrading to a paid plan or setting up a cron job to ping `/health` every 10 minutes.

### Database Migrations
- Migrations run automatically on each deploy via `prisma migrate deploy`.
- If you need to run migrations manually: Render Dashboard → sitebank-backend → Shell → `cd backend && npx prisma migrate deploy`.
