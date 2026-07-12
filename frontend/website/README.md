# SiteBank Web App (Frontend)

This directory contains the Next.js frontend application for SiteBank, a property listing and smart-link platform for real-estate agents.

## What It Has (Features)

The web application is divided into three main route groups:

### 1. Agent Portal (`/src/app/(agent)`)
The core authenticated experience for real-estate agents and agency admins.
- **Dashboard**: High-level overview of active properties, recent leads, and smart-link engagement.
- **Properties**: Create, edit, and manage property listings with AI-generated titles and descriptions.
- **Smart Links**: Generate and track shareable microsites for properties.
- **Leads**: Built-in CRM to track potential buyers, capture sources (Smart Link, Direct, etc.), and schedule follow-ups.
- **Analytics**: Detailed engagement metrics, page views, and WhatsApp clicks on smart links.
- **Profile & Settings**: Manage agent profile, RERA number, agency details, and subscription plans.

### 2. Public Microsites (`/src/app/p/[slug]`)
- Fast, SEO-optimized, public-facing property pages generated via Smart Links.
- Designed to capture leads natively and redirect to WhatsApp.

### 3. Authentication (`/src/app/(auth)`)
- Login, Registration, Forgot Password, Reset Password, and Email Verification.

---

## What It Uses (Tech Stack)

The frontend is built with modern React best practices and a robust tooling ecosystem:

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with class-variance-authority and tailwind-merge
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives styled similarly to shadcn/ui
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Fetching**: [TanStack React Query](https://tanstack.com/query/latest) & Axios
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Error Tracking**: [Sentry](https://sentry.io/)

---

## How to Run This Site

Follow these steps to run the Next.js frontend locally:

### 1. Prerequisites
Make sure you have `pnpm` and `Node.js` (v20+) installed. You must also have the `api` (backend) running locally to use the app effectively.

### 2. Environment Variables
Navigate to the `apps/web` directory and copy the example environment file:
```bash
cp .env.example .env.local
```
Ensure the API URL is correctly pointed to your local backend (usually `http://localhost:4000/api/v1`).
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install Dependencies
Run the installation from the root of the monorepo:
```bash
# from the monorepo root
pnpm install
```

### 4. Start the Development Server
You can start the site using turbo from the root of the monorepo, or directly from the `apps/web` folder:

**Option A: Run from Monorepo Root (Recommended)**
```bash
# Starts both the API and Web App concurrently
pnpm dev
```
*or just the web app:*
```bash
npx turbo run dev --filter=web
```

**Option B: Run directly from `apps/web`**
```bash
cd apps/web
pnpm run dev
```

The site will be available at [http://localhost:3000](http://localhost:3000).

### 5. Production Build
To create an optimized production build of the web app:
```bash
cd apps/web
pnpm run build
pnpm run start
```
