# Agenda de contactos — React + Express + PostgreSQL

Práctica de live coding backend: reconstruye la API de contactos de
[`prueba-tecnica-backend-atl`](../prueba-tecnica-backend-atl) (PHP puro) en
**Node/Express + TypeScript**, misma arquitectura, otro lenguaje, y le suma
un frontend en **React**, persistencia real en **PostgreSQL** y todo el
stack corriendo en **Docker**. El objetivo no es "otra prueba técnica": es
material de estudio para una entrevista de live coding, con el backend como
punto a pulir — empieza por
**[`docs/00-guia-de-estudio.md`](docs/00-guia-de-estudio.md)**.

> ⏱️ **Tiempo invertido:** ver la nota al final de este README.

---

## Índice

- [Funcionalidad](#funcionalidad)
- [Stack](#stack)
- [Cómo correr el proyecto](#cómo-correr-el-proyecto)
- [Credenciales de prueba](#credenciales-de-prueba)
- [Endpoints](#endpoints)
- [Estructura del repo](#estructura-del-repo)
- [Convenciones de código](#convenciones-de-código)
- [Testing](#testing)
- [Documentación adicional](#documentación-adicional)

## Funcionalidad

- **CRUD de contactos** — listar (con paginación, búsqueda, filtro por
  favorito y orden), obtener uno, crear, reemplazar (`PUT`), actualizar
  parcialmente (`PATCH`, para el ★ de favorito) y eliminar. Cada contacto
  tiene cero o más teléfonos con tipo (`mobile`/`home`/`work`/`other`).
- **Autenticación con JWT** — login con email/contraseña; las escrituras de
  contactos requieren `Authorization: Bearer <token>`.
- **Estadísticas** — total de contactos, favoritos y top 5 empresas
  (`GET /api/contacts/stats`), agregadas con `Promise.all`.
- **Importar contactos desde una API externa** (randomuser.me) —
  `POST /api/contacts/import`, con `Promise.allSettled`, timeout y reintento.
- **Validación completa con Zod**, igual de estricta que la versión PHP
  (nombre, email, teléfono a 10 dígitos, sin duplicados).
- **Persistencia real en PostgreSQL** (vía `pg`, sin ORM) detrás de un
  `ContactRepository` — cambiar de motor es una clase nueva, no reescribir
  el resto de la app.
- **Frontend en React** que consume la API completa: login, lista con
  filtros y paginación, crear/editar/borrar, marcar favorito, importar.

## Stack

- **Backend**: Node 22, TypeScript, Express 5, Zod 4, `pg`, JWT, bcrypt.
- **Frontend**: React 19, Vite, TypeScript, `react-router`.
- **Base de datos**: PostgreSQL 16.
- **Infra**: Docker + Docker Compose, nginx (sirve el frontend y hace de
  proxy a la API), DBeaver (inspección de la BD), Postman (pruebas).
- **Tests**: Vitest + Supertest (backend, con repos en memoria + Postgres
  real), Vitest + Testing Library (frontend).

## Cómo correr el proyecto

### Opción A — Todo en Docker (recomendado para probar rápido)

```bash
cp .env.example .env          # ajusta JWT_SECRET si quieres
docker compose up --build
```

- Frontend: <http://localhost:8080>
- API: <http://localhost:3000/api>
- Postgres: `localhost:5432` (usuario/contraseña/base en `.env`)

La primera vez que arranca, el contenedor `api` crea las tablas y siembra 8
contactos de ejemplo + un usuario demo automáticamente. Ver
**[`docs/07-docker-desktop.md`](docs/07-docker-desktop.md)** para el
recorrido completo, el diagrama de cómo se conecta todo y troubleshooting.

### Opción B — Modo desarrollo (hot reload)

```bash
pnpm --dir backend install
pnpm --dir frontend install

docker compose up -d db        # solo Postgres, en Docker
pnpm --dir backend db:migrate -- --fresh --seed

pnpm --dir backend dev          # http://localhost:3000
pnpm --dir frontend dev         # http://localhost:5173 (proxy /api → :3000)
```

## Credenciales de prueba

```
email:    demo@example.com
password: Demo1234!
```

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | — | Estado de la API y la base |
| POST | `/api/auth/login` | — | Login → `{ token, user }` |
| GET | `/api/auth/me` | JWT | Usuario autenticado |
| GET | `/api/contacts` | — | Lista paginada + filtros |
| GET | `/api/contacts/stats` | — | Total, favoritos, top empresas |
| GET | `/api/contacts/:id` | — | Un contacto |
| POST | `/api/contacts` | JWT | Crear |
| PUT | `/api/contacts/:id` | JWT | Reemplazar |
| PATCH | `/api/contacts/:id` | JWT | Actualizar parcial |
| DELETE | `/api/contacts/:id` | JWT | Eliminar |
| POST | `/api/contacts/import` | JWT | Importar desde randomuser.me |

Referencia completa (campos, reglas, códigos de error) en
**[`docs/08-api-reference.md`](docs/08-api-reference.md)**.

## Estructura del repo

```
backend/            # API Express + TypeScript (ver docs/02-arquitectura-backend.md)
frontend/           # SPA React + Vite (ver docs/10-frontend-react.md)
docker/             # scripts de init de Postgres
docs/                # toda la documentación — empieza en docs/00-guia-de-estudio.md
docs/ejercicios/     # katas de práctica para la entrevista de live coding
postman/             # colección + environment para probar la API
docker-compose.yml
```

## Convenciones de código

Este repo sigue reglas de estilo obligatorias (300 líneas por archivo,
pages que solo renderizan, máximo 7 props por componente, sin ternarios
anidados, sin `interface`/`type` dentro de un archivo que renderiza) —
detalle completo en **[`CLAUDE.md`](CLAUDE.md)** y en la skill
**[`.claude/skills/convenciones-codigo/SKILL.md`](.claude/skills/convenciones-codigo/SKILL.md)**.

## Testing

```bash
pnpm --dir backend test              # unit + api, con repos en memoria (rápido)
pnpm --dir backend test:integration  # contra Postgres real (requiere `docker compose up -d db`)
pnpm --dir frontend test
```

Detalle de cómo están escritos en
**[`docs/06-testing-vitest-supertest.md`](docs/06-testing-vitest-supertest.md)**.

## Documentación adicional

- [`docs/00-guia-de-estudio.md`](docs/00-guia-de-estudio.md) — por dónde empezar y cómo prepararte para la entrevista.
- [`docs/01-flujo-git-github.md`](docs/01-flujo-git-github.md) — flujo Git/GitHub.
- [`docs/02-arquitectura-backend.md`](docs/02-arquitectura-backend.md) — capas, flujo de una request, equivalencias con la versión PHP.
- [`docs/03-fundamentos-node-express.md`](docs/03-fundamentos-node-express.md) — Node/Express desde cero.
- [`docs/04-typescript-en-el-backend.md`](docs/04-typescript-en-el-backend.md) — TypeScript aplicado a Express.
- [`docs/05-postgresql-y-pg.md`](docs/05-postgresql-y-pg.md) — `pg`, transacciones, migraciones.
- [`docs/06-testing-vitest-supertest.md`](docs/06-testing-vitest-supertest.md) — cómo están escritos los tests.
- [`docs/07-docker-desktop.md`](docs/07-docker-desktop.md) — cómo se conecta y funciona todo el stack en Docker Desktop.
- [`docs/08-api-reference.md`](docs/08-api-reference.md) — referencia completa de la API.
- [`docs/09-postman-y-dbeaver.md`](docs/09-postman-y-dbeaver.md) — probar la API y explorar la base de datos.
- [`docs/10-frontend-react.md`](docs/10-frontend-react.md) — estructura y flujo de datos del frontend.
- [`docs/11-decisiones-tecnicas.md`](docs/11-decisiones-tecnicas.md) — por qué de cada decisión técnica.
- [`docs/ejercicios/`](docs/ejercicios/) — katas de práctica para la entrevista de live coding.

---

### Nota sobre el tiempo invertido

Este proyecto se generó con **Claude Code** en una sesión de trabajo asistida
por IA: arquitectura backend (capas, validación con Zod, repositorio sobre
`pg`, JWT, paginación/filtro, llamada externa con `Promise.allSettled`),
frontend React completo, Dockerfiles + `docker-compose.yml`, colección de
Postman, y toda la documentación de estudio (fundamentos de Node/Express,
TypeScript, PostgreSQL, testing, Docker, y las katas de práctica de
`docs/ejercicios/`). Todo verificado de punta a punta: lint, typecheck,
tests unitarios/API/integración contra Postgres real, build de producción,
el stack completo levantado en Docker, y un recorrido manual con navegador
(login → listar → buscar → crear → favorito → borrar).
