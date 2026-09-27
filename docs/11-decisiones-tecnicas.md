# 11 - DECISIONES TÉCNICAS

Por qué de cada decisión relevante y qué alternativas se descartaron.

## Express 5, sin framework más "batteries included"

Fastify o NestJS son más rápidos/estructurados respectivamente, pero
**Express es el que más aparece en pruebas de live coding** — el objetivo
explícito de este repo es dominarlo a fondo, no elegir el framework
"técnicamente mejor". Express 5 (no 4) porque ya reenvía solo las promesas
rechazadas de un handler async a `errorHandler` — un controller de este
repo se ve más simple que uno equivalente en Express 4 (sin el
`asyncHandler` de siempre), y es la versión que instala `npm install
express` hoy.

## `pg` sin ORM

Un ORM (Prisma, TypeORM) abstrae SQL — perfecto para producción, pero en
una entrevista de 45 minutos aprender la API de un ORM que no conoces
compite por tiempo con resolver el problema real. SQL a mano con `pg`
(queries parametrizadas, una transacción cuando hace falta) es lo que
cualquier entrevistador espera que sepas escribir de memoria.

## TypeScript fijado en `~6.0.3` (no la última)

`typescript-eslint` 8.70 declara como peer dependency `typescript: '>=4.8.4
<6.1.0'` — TypeScript 7 (ya publicado en el registro) rompe esa cota. Se
fija la versión en vez de dejar que el lint truene con una advertencia de
peer dependency no satisfecha.

## Vitest en vez de Jest

Cero configuración para TypeScript (usa `esbuild` internamente; Jest
necesita `ts-jest` o Babel), arranca más rápido, y la API es casi idéntica
a Jest (`describe`/`it`/`expect`, `vi.fn()` en vez de `jest.fn()`) — la
curva de aprendizaje es mínima si ya conoces Jest. Ver la tabla de
equivalencias en `docs/06-testing-vitest-supertest.md`.

## `409 Conflict` para el email duplicado (no `422`, como en la versión PHP)

La versión PHP de ATL devuelve `422` para un email duplicado (lo trata
como un error más de validación, junto con "nombre vacío" o "email con
formato inválido"). Esta versión usa `409`:

- **422** = "tu request está mal formada" (el formato del dato en sí es
  inválido — un email sin `@`, un nombre vacío).
- **409** = "tu request está bien formada, pero choca con el estado actual
  del servidor" (el email es válido, pero *ya existe* otro contacto con
  ese email — un problema de *concurrencia/estado*, no de formato).

Semánticamente `409` es la más correcta para este caso según la spec HTTP,
y es un código que vale la pena saber distinguir en una entrevista.

## `pg` no puede parametrizar identificadores → whitelist en `ORDER BY`

Ver `docs/05-postgresql-y-pg.md`, sección de índices — no es una decisión
de estilo, es una limitación real de cualquier driver SQL (los
placeholders son para valores, no para nombres de columna).

## Sin `405 Method Not Allowed` explícito

La versión PHP de ATL, con un router escrito a mano, distinguía "la ruta
existe pero con otro método" (→ `405` + header `Allow`) de "la ruta no
existe" (→ `404`). Replicar eso con `express.Router()` requeriría inspeccionar
manualmente qué métodos están registrados para cada path — posible, pero
agrega complejidad que no está en el criterio de evaluación de este
proyecto. Se simplifica a: cualquier combinación método+ruta no registrada
cae en el `404` genérico de `notFoundHandler`.

## Logger propio en vez de `morgan`/`pino`

Una dependencia menos que aprender vale más, en un proyecto de práctica,
que el formato de log más pulido — `requestLogger`
(`middlewares/request-logger.ts`) es 12 líneas: método, ruta, status,
duración. En un proyecto real de producción, `pino` (structured logging,
mucho más rápido que `console.log` bajo carga) sería la elección obvia.

## bcryptjs en vez de `bcrypt`

`bcrypt` (el paquete nativo, con bindings de C++) es más rápido, pero
necesita compilarse durante `pnpm install` (requiere herramientas de
compilación en la máquina/imagen Docker). `bcryptjs` es una implementación
pura en JS — un poco más lenta, pero cero dependencias nativas, cero
sorpresas al construir la imagen de Docker en una máquina distinta a la
que la desarrolló.

## JWT en `localStorage` (frontend) en vez de cookie `httpOnly`

Una cookie `httpOnly` es más segura contra XSS (JavaScript no puede leerla,
así que un script inyectado no puede robarla) — pero requiere configurar
`SameSite`/`Secure` correctamente y coordinar dominios entre el frontend y
la API. Para una app de práctica sin datos sensibles reales,
`localStorage` (leído a mano en cada `fetch`, ver `api/http.ts`) es más
simple de razonar y de depurar en una entrevista. En una app de producción
real con datos sensibles, la cookie `httpOnly` sería la elección correcta.

## Dos paquetes pnpm independientes, no un monorepo/workspace

`backend/` y `frontend/` tienen cada uno su propio `package.json` y
`pnpm-lock.yaml`, sin un `pnpm-workspace.yaml` que los una. Así cada
`Dockerfile` usa su propia carpeta como contexto de build sin arrastrar
las dependencias (ni el código) del otro paquete — más simple que
configurar un monorepo real (con sus reglas de "qué se comparte", scripts
`--filter`, etc.) para solo dos paquetes que no comparten código entre sí.

## El CLI de migraciones corre con `tsx`, no compilado

`scripts/db-migrate.ts` no se compila a `dist/` — corre con `tsx` tanto en
desarrollo (`pnpm db:migrate`) como dentro del contenedor Docker
(`pnpm exec tsx scripts/db-migrate.ts`). La alternativa (compilarlo junto
con `src/` y ajustar todos los imports relativos para que apunten a rutas
compiladas) agregaba complejidad de build por un script que se corre unas
pocas veces por arranque, no en el camino caliente de cada request — el
costo de arrancar `tsx` una vez al iniciar el contenedor es insignificante
frente a la simplicidad de tener un solo código fuente para dev y prod.
Por eso el `Dockerfile` copia tanto `dist/` (para `node dist/server.js`)
como `src/` (para que `tsx` pueda resolver los imports del script).
