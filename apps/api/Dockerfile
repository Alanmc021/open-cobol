# ── Stage 1: builder ──────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@10

WORKDIR /app

# Copy monorepo manifests first (layer cache)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./

# Copy all packages and apps sources
COPY packages/ packages/
COPY apps/api/ apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build workspace dependencies in order, then the API
RUN pnpm --filter "@opencobol/shared" build && \
    pnpm --filter "@opencobol/parser-core" build && \
    pnpm --filter "@opencobol/rag-engine" build && \
    pnpm --filter "@opencobol/ai-runtime" build && \
    pnpm --filter "@opencobol/api" build

# Create self-contained production deployment directory
RUN pnpm deploy --filter @opencobol/api --prod /prod/api --legacy

# ── Stage 2: runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /prod/api .

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "dist/main.js"]
