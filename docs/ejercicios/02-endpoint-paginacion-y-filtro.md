# Kata 2 — Agregar un endpoint con paginación y filtro

## Preparación

```bash
git checkout -b practica/paginacion
git apply docs/ejercicios/practica/quitar-paginacion.patch
pnpm --dir backend test   # deberían fallar los tests de tests/api/contacts.list.api.test.ts
```

El parche deja `GET /api/contacts` devolviendo **todos** los contactos sin
paginar, ordenar ni filtrar — el `schema` de query, el `service` y el
`repository` **siguen intactos** (ya sabían paginar/filtrar/ordenar desde
antes); lo que falta es la parte que un entrevistador real te pediría en
vivo: la capa HTTP.

## Enunciado

`GET /api/contacts` debe soportar:

- `page` (≥ 1, default 1) y `limit` (1-50, default 10).
- `search` (texto libre sobre nombre, apellido, email y empresa).
- `favorite` (`"true"`/`"false"`, opcional).
- `sort` (`first_name`/`last_name`/`created_at`) y `order` (`asc`/`desc`).
- Responder `{ contacts: [...], meta: { page, limit, total, total_pages } }`.
- `422` si algún parámetro no es válido (p. ej. `limit=999`).

## Criterios de aceptación

- [ ] `pnpm --dir backend test` en verde, en particular
      `tests/api/contacts.list.api.test.ts` completo.
- [ ] Un `limit` fuera de rango responde `422`, no `500` ni un valor
      truncado silenciosamente.
- [ ] Cambiar de página no reinicia los demás filtros, y cambiar un filtro
      sí vuelve a la página 1 (mira cómo lo maneja el frontend en
      `frontend/src/hooks/useContacts.ts` si quieres inspiración, aunque
      esta kata es 100% backend).

## Pasos sugeridos (30-40 min)

1. **Schema de Zod** para los query params — revisa
   `src/schemas/list-contacts-query.schema.ts` (si lo dejaste intacto,
   ábrelo directo; si quieres el reto completo, bórralo también y
   créalo de cero). Recuerda: `req.query` en Express 5 no se reasigna, así
   que el parseo va a mano en el controller, no con `validateBody`.
2. **Controller** (`src/controllers/contacts.controller.ts`, método
   `index`): parsea el query con el schema, llama al service con el
   resultado.
3. **Service** (`src/services/contacts.service.ts`, método `list`): ya
   existe y usa `Promise.all` para pedir la página y el total en
   paralelo — es un buen momento para preguntarte *por qué* `Promise.all`
   y no dos `await` seguidos (pista: son independientes entre sí).
4. **Repository**: `findMany`/`count` ya filtran/ordenan/paginan tanto en
   `PgContactRepository` como en `InMemoryContactRepository` — no
   deberías necesitar tocarlos si solo quitaste la capa HTTP. Si los
   borraste también (reto extra), la whitelist de `ORDER BY` en
   `docs/05-postgresql-y-pg.md` es la pieza más fácil de olvidar.
5. **Test**: corre `tests/api/contacts.list.api.test.ts` — ya existe y
   cubre paginación, filtro por favorito, búsqueda y orden. Si lo hiciste
   bien, pasa sin tocarlo.

## Cuando termines

```bash
pnpm --dir backend lint && pnpm --dir backend typecheck && pnpm --dir backend test
git diff docs/ejercicios/practica/quitar-paginacion.patch   # ¿tu versión se parece a la original?
git checkout main
git branch -D practica/paginacion
```

## Variantes para seguir practicando

- Agrega un `sort` nuevo (p. ej. `email`) — ¿qué archivos tocaste?
- Cambia la paginación de `LIMIT/OFFSET` a paginación por cursor
  (`?after=<id>`) — no lo implementes completo, pero dibuja qué cambiaría
  en la query SQL y en la forma del `meta`.
