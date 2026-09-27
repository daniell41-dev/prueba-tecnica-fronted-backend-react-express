# syntax=docker/dockerfile:1
#
# Multi-stage: "deps" instala una sola vez y las etapas de abajo la
# reutilizan (caché de capas de Docker) — cambiar solo código fuente no
# vuelve a instalar dependencias. Ver docs/07-docker-desktop.md.

FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

# ---- deps: instala TODO (con devDependencies) ----
# Se instalan también las devDependencies (no solo --prod) porque el
# contenedor corre las migraciones con `tsx` (scripts/db-migrate.ts nunca se
# compila a JS, es un CLI de un solo uso) — ver docs/11-decisiones-tecnicas.md.
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- build: compila src/ a dist/ ----
FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm build

# ---- runtime: imagen final ----
FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY --from=build /app/dist ./dist
COPY db ./db
COPY scripts ./scripts
COPY tsconfig.json ./
# `scripts/db-migrate.ts` corre con `tsx` (no está compilado) y sus imports
# apuntan a `../src/...` — por eso el runtime necesita también el código
# fuente, no solo `dist/`. Ver docs/11-decisiones-tecnicas.md.
COPY src ./src

USER app
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Migra (idempotente) + siembra (idempotente) + arranca — en ese orden, en
# cada arranque del contenedor. Si la base ya tiene todo, ambos pasos no
# hacen nada y solo tarda una fracción de segundo extra.
CMD ["sh", "-c", "pnpm exec tsx scripts/db-migrate.ts -- --seed && node dist/server.js"]
