# Turborepo-style Dockerfile: one per service, turbo prune, Railway builds from repo.
# Build from repo root: docker build -f apps/backend/Dockerfile .
# Refs: https://turborepo.dev/docs/guides/tools/docker

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update -qq && apt-get install --no-install-recommends -y ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# ---
FROM base AS prepare
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @repo/backend --docker

# ---
FROM base AS builder
WORKDIR /app

# Install dependencies (layer only invalidated when this app's deps change)
COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Build the project and its dependencies
COPY --from=prepare /app/out/full/ .

# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM
# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN pnpm turbo build

# Production bundle for backend (and worker/cron use same image, different CMD)
RUN pnpm --filter @repo/backend --prod deploy /app-prod

# ---
FROM node:${NODE_VERSION}-slim AS runner

RUN addgroup --system --gid 1001 backend 
RUN adduser --system --uid 1001 backend
USER backend

COPY --from=builder --chown=backend:backend /app-prod ./

ENV NODE_ENV=production

# Default: API server. Override the start command per Railway service:
#   worker            -> node dist/worker.js
#   cron (Mon/Thu)    -> node dist/scripts/send-statement-scheduled-reminders.js     (schedule: "0 6 * * 1,4" UTC = 01:00 Bogota)
#   cron (daily)      -> node dist/scripts/mark-invoices-overdue.js && node dist/scripts/send-invoice-due-today-reminders.js
#                                                                                    (schedule: "0 6 * * *"   UTC = 01:00 Bogota)
# The daily cron chains mark-overdue first so invoices whose due day has passed are
# flipped to OVERDUE before the due-today reminder iterates. On the very first
# real run, set MARK_INVOICES_OVERDUE_DRY_RUN=true to inspect candidate counts in
# the logs without modifying any rows; unset it for steady-state operation.
CMD ["node", "dist/server.js"]
