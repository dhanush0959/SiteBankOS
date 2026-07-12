# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY backend/package.json backend/
COPY frontend/website/package.json frontend/website/
COPY packages/types/package.json packages/types/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages packages
COPY backend backend
RUN pnpm --filter @sitebank/types build \
 && pnpm --filter api db:generate \
 && pnpm --filter api build

FROM node:20-bookworm-slim AS runner
# Install system dependencies for Playwright/Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    dumb-init \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
COPY --from=build --chown=node:node /repo/pnpm-workspace.yaml /repo/package.json /repo/pnpm-lock.yaml ./
COPY --from=build --chown=node:node /repo/backend/package.json backend/
COPY --from=build --chown=node:node /repo/packages/types packages/types
COPY --from=build --chown=node:node /repo/backend/dist backend/dist
COPY --from=build --chown=node:node /repo/backend/prisma backend/prisma
COPY --from=build --chown=node:node /repo/backend/node_modules backend/node_modules
COPY --from=build --chown=node:node /repo/node_modules ./node_modules

# Pre-install Playwright browser (Chromium)
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN cd backend && npx playwright install chromium \
 && chmod -R 777 /ms-playwright

EXPOSE 4000
USER node
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "cd backend && pnpm db:migrate:prod && node dist/main"]
