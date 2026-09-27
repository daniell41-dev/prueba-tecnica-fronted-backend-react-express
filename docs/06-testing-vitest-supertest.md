# 06 - TESTING CON VITEST Y SUPERTEST

## La pirámide de tests de este repo

```
tests/integration/   ← pocos, lentos, contra Postgres real            (pnpm test:integration)
tests/api/           ← muchos, rápidos, HTTP de punta a punta          (pnpm test)
tests/unit/          ← muchísimos, instantáneos, una función/clase     (pnpm test)
```

`tests/unit` y `tests/api` corren con `pnpm test` (nunca abren una conexión
real) — son los que corres constantemente mientras programas. `tests/integration`
corre aparte (`pnpm test:integration`, requiere `docker compose up -d db`)
porque necesita Postgres real y es más lento.

## Repo en memoria vs Postgres real

```ts
// tests/helpers/in-memory-contact.repository.ts
export class InMemoryContactRepository implements ContactRepository {
  private readonly contacts = new Map<string, Contact>();
  // implementa los mismos métodos que PgContactRepository, sobre un Map
}
```

Como `ContactsService` depende de la **interfaz** `ContactRepository`
(nunca de `PgContactRepository`), los tests de servicio y de API inyectan
esta versión en memoria — corren en milisegundos y no necesitan Docker ni
una base de datos. La cobertura de "¿el SQL realmente hace lo que dice?"
(transacciones, la restricción única, el cascade al borrar) vive aparte, en
`tests/integration/pg-contact.repository.test.ts`, contra Postgres real.

## Supertest: pegarle a la app sin levantar un puerto

```ts
// tests/api/contacts.create.api.test.ts
const { app, authToken } = await buildTestApp();
const response = await request(app).post('/api/contacts').set('Authorization', `Bearer ${authToken}`).send(payload);
expect(response.status).toBe(201);
```

`request(app)` (de `supertest`) toma la instancia de Express **sin**
llamar a `.listen()` — Supertest abre un socket efímero solo para esa
llamada. `buildTestApp()` (`tests/helpers/build-test-app.ts`) arma la app
completa (`createApp(deps)`) con repositorios en memoria, exactamente como
`container.ts` la arma en producción pero sin Postgres — es el mismo patrón
que usaba `ContactApiTest::setUp()` en la versión PHP con SQLite en
memoria.

## La API de Vitest (si vienes de Jest)

| Jest | Vitest | Nota |
|---|---|---|
| `describe`, `it`/`test`, `expect` | igual | Misma API, compatible casi 1:1 |
| `jest.fn()` | `vi.fn()` | |
| `jest.spyOn(obj, 'method')` | `vi.spyOn(obj, 'method')` | |
| `jest.mock('./modulo')` | `vi.mock('./modulo')` | |
| No tiene equivalente directo | `vi.stubGlobal('fetch', vi.fn())` | Sustituye un global (`fetch`, `Date`...) para todo el test |
| `beforeEach(() => jest.clearAllMocks())` | `restoreMocks: true` en la config | Se configura una vez, no hace falta repetirlo en cada archivo |
| `ts-jest` / babel config | nada — Vitest usa `esbuild` internamente | Cero configuración extra para que TypeScript funcione |

Este repo usa `vi.stubGlobal('fetch', ...)` en
`tests/unit/random-user.client.test.ts` para probar el cliente HTTP externo
sin red real:

```ts
vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(validPayload)));
const people = await new HttpRandomUserClient().fetchRandomPeople(1);
```

## TDD para arreglar un bug: rojo → verde

El flujo que espera cualquier entrevistador cuando dice "corrige este bug y
escribe su test" (ver `docs/ejercicios/04-corregir-bug-y-test.md`):

1. **Reproduce el bug manualmente** (un `curl`, o corriendo la app) para
   confirmar que existe.
2. **Escribe el test que *debería* pasar** si el código estuviera bien —
   con el bug todavía presente, ese test **falla** (rojo). Confirmar que
   falla por la razón correcta es tan importante como el fix: si tu test
   pasa con el bug puesto, no está probando lo que crees.
3. **Arregla el código.**
4. **Corre el test de nuevo** — ahora pasa (verde).
5. Commit: un `test:` (o junto con el `fix:` en el mismo commit, según
   convención del repo — aquí se prefiere un solo commit `fix:` que incluya
   el test, porque el fix sin su test no está completo).

## Repos partidos por endpoint, no un archivo gigante

```
tests/api/
├── contacts.list.api.test.ts     # GET /api/contacts (paginación, filtros)
├── contacts.create.api.test.ts   # POST /api/contacts
├── contacts.get.api.test.ts      # GET /api/contacts/:id
├── contacts.update.api.test.ts   # PUT y PATCH /api/contacts/:id
├── contacts.delete.api.test.ts   # DELETE /api/contacts/:id
├── contacts.stats.api.test.ts    # GET /api/contacts/stats
└── contacts.import.api.test.ts   # POST /api/contacts/import
```

Es la misma convención de 300 líneas por archivo que aplica al código de
producción (ver `CLAUDE.md`) — un archivo de tests por endpoint es más
fácil de ubicar y de mantener corto que un `contacts.api.test.ts` con 40
tests adentro.
