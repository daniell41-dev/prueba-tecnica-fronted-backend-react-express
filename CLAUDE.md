# CLAUDE.md

Guía operativa para Claude (y cualquier dev) en este repositorio. Léela antes de trabajar.

## Proyecto

**Agenda de contactos full-stack** — práctica de live coding backend, hermana de
`prueba-tecnica-backend-atl` (PHP) y `prueba-tecnica-fronted-atl` (Angular), pero
reconstruida en **Node/Express** con **React** al frente y **PostgreSQL** como base real.
El objetivo no es "otra prueba técnica": es material de estudio para una entrevista de
live coding, con el backend como punto a pulir. Empieza por
**[`docs/00-guia-de-estudio.md`](docs/00-guia-de-estudio.md)**.

## Stack

- **Backend**: Node 22, TypeScript, Express 5, Zod 4, `pg` (sin ORM), JWT, PostgreSQL 16.
- **Frontend**: React 19, Vite, TypeScript, `react-router`.
- **Infra**: Docker + Docker Compose, DBeaver (inspección de la BD), Postman (pruebas).
- **Tests**: Vitest + Supertest (backend), Vitest + Testing Library (frontend).

## Gestor de paquetes: pnpm (obligatorio)

⚠️ **Usa siempre `pnpm`, nunca `npm` ni `yarn`.** Son dos paquetes independientes
(`backend/`, `frontend/`), cada uno con su propio `pnpm-lock.yaml` — no es un workspace.

```bash
# Backend
pnpm --dir backend install
pnpm --dir backend dev            # servidor con reinicio en caliente → http://localhost:3000
pnpm --dir backend build          # compila a backend/dist
pnpm --dir backend test           # Vitest (unit + api, con repos en memoria)
pnpm --dir backend test:integration   # Vitest contra Postgres real (requiere `pnpm db:up`)
pnpm --dir backend lint
pnpm --dir backend typecheck
pnpm --dir backend db:migrate -- --fresh --seed

# Frontend
pnpm --dir frontend install
pnpm --dir frontend dev           # → http://localhost:5173 (proxy /api → :3000)
pnpm --dir frontend build
pnpm --dir frontend test
pnpm --dir frontend lint

# Todo el stack en Docker
docker compose up --build         # db (5432) + api (3000) + web (8080)
```

Scripts de conveniencia en la raíz (`package.json`): `pnpm lint`, `pnpm test`, `pnpm build`,
`pnpm dev:backend`, `pnpm dev:frontend`, `pnpm db:up`, `pnpm docker:up`.

## ⚠️ Convenciones de código obligatorias

Aplican a `backend/` y `frontend/` por igual. Están reforzadas por ESLint y por
`scripts/check-file-length.mjs` — romperlas hace fallar `pnpm lint`. Detalle completo,
ejemplos y checklist en la skill
**[`.claude/skills/convenciones-codigo/SKILL.md`](.claude/skills/convenciones-codigo/SKILL.md)**
(se carga sola al tocar código `.ts`/`.tsx`).

1. **Ningún archivo de código supera las 300 líneas.** Se separa la lógica en funciones
   más pequeñas dentro de `utils/`, o en componentes/hooks nuevos — nunca en un archivo
   "parte 2".
2. **Frontend: las `pages/` solo renderizan.** Llaman a un hook propio
   (`useContacts`, `useContactForm`…) y componen componentes de `components/`. Nada de
   `useState`/`useEffect`/`fetch` dentro de una page.
3. **Máximo 7 props por componente.** Si necesita más, se agrupan en un objeto o el
   componente se parte.
4. **No abusar de los ternarios.** Cero ternarios anidados; para condicionales se usa
   early return, `&&`, un objeto de mapeo o un subcomponente.
5. **Ningún `interface`/`type` dentro de un archivo que renderiza.** Van en `types/` (o
   junto al schema de Zod en el backend) y se importan con `import type`.

## Antes de terminar una tarea

```bash
pnpm lint && pnpm test && pnpm build
node scripts/check-file-length.mjs
```

Y prueba manualmente al menos un endpoint con `curl` o la colección de Postman
(`postman/contacts-api.postman_collection.json`).

## Convenciones

- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`,
  `chore:`, `ci:`, `build:`). Ver `docs/01-flujo-git-github.md`.
- **Ramas:** rama de sesión / `feature/<desc>` desde `develop`; PR a `develop`; PR
  `develop → main` solo a petición explícita.
- **Arquitectura y estilo:** `docs/02-arquitectura-backend.md` y `docs/10-frontend-react.md`.
- **Decisiones técnicas:** `docs/11-decisiones-tecnicas.md`.
- **Contrato de la API:** `docs/08-api-reference.md`.

## Documentación del repo

- `README.md` — qué es la app, cómo correrla (Docker y modo dev), credenciales demo.
- `docs/00-guia-de-estudio.md` — por dónde empezar y cómo prepararte para la entrevista.
- `docs/01-flujo-git-github.md` — flujo Git/GitHub.
- `docs/02-arquitectura-backend.md` — capas, flujo de una request, equivalencias con la
  versión PHP de ATL.
- `docs/03-fundamentos-node-express.md` — Node/Express desde cero.
- `docs/04-typescript-en-el-backend.md` — TypeScript aplicado a Express.
- `docs/05-postgresql-y-pg.md` — `pg`, transacciones, migraciones.
- `docs/06-testing-vitest-supertest.md` — cómo están escritos los tests.
- `docs/07-docker-desktop.md` — cómo se conecta y funciona todo el stack en Docker Desktop.
- `docs/08-api-reference.md` — referencia completa de la API.
- `docs/09-postman-y-dbeaver.md` — probar la API y explorar la base de datos.
- `docs/10-frontend-react.md` — estructura y flujo de datos del frontend.
- `docs/11-decisiones-tecnicas.md` — por qué de cada decisión técnica relevante.
- `docs/ejercicios/` — katas de práctica para la entrevista de live coding.
