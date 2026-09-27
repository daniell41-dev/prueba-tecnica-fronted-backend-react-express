# 00 - GUÍA DE ESTUDIO

Este repo no es solo "otra prueba técnica": es material para prepararte para
una **entrevista de live coding**, con foco en backend (tu punto más débil,
según tú mismo). Esta guía es el punto de entrada — dice qué leer, en qué
orden, y cómo usar el resto del repo para practicar bajo presión sin que los
nervios te ganen.

## 1. Entender la estructura en 10 minutos

Antes de leer nada más, haz el recorrido guiado de
**[`docs/ejercicios/01-entender-la-estructura-en-10-min.md`](ejercicios/01-entender-la-estructura-en-10-min.md)**.
Es exactamente lo que te van a pedir al arrancar una entrevista de live
coding ("abre el repo y cuéntame qué hace") — practícalo primero para que el
resto de esta guía tenga contexto.

## 2. Orden de lectura recomendado

| # | Doc | De qué trata | Tiempo aprox. |
|---|---|---|---|
| 1 | [`02-arquitectura-backend.md`](02-arquitectura-backend.md) | Capas, flujo de una request, equivalencias con la versión PHP de ATL | 20 min |
| 2 | [`03-fundamentos-node-express.md`](03-fundamentos-node-express.md) | Event loop, middlewares, Express 5, async/Promise.all/allSettled | 40 min |
| 3 | [`04-typescript-en-el-backend.md`](04-typescript-en-el-backend.md) | tsconfig, tipos de Express, Zod + `z.infer` | 20 min |
| 4 | [`05-postgresql-y-pg.md`](05-postgresql-y-pg.md) | `Pool`, queries parametrizadas, transacciones, migraciones | 30 min |
| 5 | [`06-testing-vitest-supertest.md`](06-testing-vitest-supertest.md) | Cómo están escritos los tests, Vitest vs Jest | 20 min |
| 6 | [`07-docker-desktop.md`](07-docker-desktop.md) | Cómo se conecta y funciona todo el stack en contenedores | 30 min |
| 7 | [`10-frontend-react.md`](10-frontend-react.md) | El frontend, por si la entrevista toca algo de React | 15 min |

Con eso ya tienes el panorama completo. **[`08-api-reference.md`](08-api-reference.md)**
y **[`09-postman-y-dbeaver.md`](09-postman-y-dbeaver.md)** son referencia,
no hace falta memorizarlos — vuelve a ellos cuando los necesites.

## 3. Practica con las katas

Una vez que entiendes el código, la única forma de que lo domines bajo
presión es **rehacerlo tú mismo, con reloj**. Las katas de
**[`docs/ejercicios/`](ejercicios/)** cubren justo eso:

1. [Entender la estructura en 10 min](ejercicios/01-entender-la-estructura-en-10-min.md) — ya lo hiciste en el paso 1.
2. [Endpoint con paginación y filtro](ejercicios/02-endpoint-paginacion-y-filtro.md) — bórralo (`docs/ejercicios/practica/quitar-paginacion.patch`) y vuelve a implementarlo.
3. [Middleware JWT](ejercicios/03-middleware-jwt.md) — bórralo (`docs/ejercicios/practica/quitar-jwt.patch`) y vuelve a implementarlo.
4. [Corregir un bug y escribir su test](ejercicios/04-corregir-bug-y-test.md) — tres bugs reales metidos a propósito, uno por uno.
5. [Simulacro de entrevista](ejercicios/05-simulacro-entrevista.md) — las cuatro anteriores, con reloj, de punta a punta.

## 4. El bloque "Tests y Docker" (3-4 h)

Si tu plan de estudio incluye ese bloque específico, ya está cubierto por
este repo en su totalidad, no hace falta nada extra:

- **Tests con Vitest + Supertest** — `backend/tests/{unit,api,integration}`.
  Empieza por `docs/06-testing-vitest-supertest.md`.
- **Dockerfile + docker-compose con PostgreSQL, conectando con `pg`** —
  `backend/Dockerfile`, `docker-compose.yml`, `backend/src/db/pool.ts`.
  Empieza por `docs/07-docker-desktop.md`.
- **`async/await`, `Promise.all` y manejo de errores en llamadas externas** —
  `backend/src/clients/random-user.client.ts` (fetch + timeout + reintento)
  y `backend/src/services/contact-import.service.ts` (`Promise.allSettled`).
  Detalle en `docs/03-fundamentos-node-express.md`.

## 5. Cómo llevar buena imagen en la entrevista (y no perderte con los nervios)

Esto importa tanto como el código:

- **Repite el enunciado en voz alta con tus palabras** antes de escribir una
  línea. Te da 30 segundos para pensar sin que se sienta como silencio
  incómodo, y confirma que entendiste lo que te pidieron.
- **Pregunta lo que no esté claro.** "¿El filtro por favorito es exacto o
  puede venir vacío?" es una pregunta de senior, no de quien no sabe.
- **Di tu plan antes de teclear.** "Voy a agregar el schema de Zod, luego el
  repo, después el servicio con `Promise.all` para paginar y contar en
  paralelo, y al final el controller." Si te trabas a mitad, el
  entrevistador ya sabe a dónde ibas — y tú también, porque lo dijiste.
- **Da pasos chicos y corre los tests seguido.** No escribas 80 líneas y
  luego pruebes: escribe el schema, corre algo, escribe el repo, corre algo.
  Cada paso que compila y corre es una ganancia visible, y si algo falla, el
  radio de búsqueda es de 10 líneas, no de 80.
- **Si te atoras, dilo.** "Sé que esto lo resuelvo con un `Map` para agrupar,
  dame un segundo" es normal y esperado. El silencio prolongado es lo que
  incomoda, no admitir que estás pensando.
- **Si no sabes algo, dilo y proponte una alternativa razonable.** Nadie
  espera que recuerdes de memoria la sintaxis exacta de un índice compuesto
  en Postgres; sí esperan que sepas que existe y para qué sirve.
- **Antes de la entrevista**, corre el checklist:
  - [ ] `docker compose up -d db && pnpm --dir backend db:migrate -- --fresh --seed`
  - [ ] `pnpm --dir backend dev` arranca sin errores
  - [ ] `pnpm --dir backend test` en verde
  - [ ] Un `curl` a `/api/contacts` responde
  - [ ] Repasaste el recorrido de `docs/ejercicios/01-entender-la-estructura-en-10-min.md`
  - [ ] Hiciste al menos una vez el simulacro de `docs/ejercicios/05-simulacro-entrevista.md`

## 6. Preguntas teóricas frecuentes (para tener la respuesta lista)

- **¿Por qué Express y no Fastify/NestJS?** Es el más usado en la industria
  y el que casi siempre aparece en pruebas de live coding — dominarlo a
  fondo (middlewares, orden de ejecución, manejo de errores) vale más que
  conocer superficialmente tres frameworks.
- **¿Cómo evitas la inyección SQL sin un ORM?** Queries siempre
  parametrizadas (`$1`, `$2`...) — nunca interpolando strings. La única
  excepción son los identificadores (nombre de columna en `ORDER BY`), que
  no se pueden parametrizar y por eso pasan por una whitelist
  (`SORT_COLUMNS` en `pg-contact.repository.ts`).
- **¿Por qué `Promise.all` en la paginación y `Promise.allSettled` en la
  importación?** `Promise.all` cuando *todas* las operaciones tienen que
  salir bien para que el resultado tenga sentido (contar y listar van
  juntos). `Promise.allSettled` cuando una falla individual (un contacto
  duplicado al importar) no debe tirar abajo las demás.
- **¿Qué pasa si Postgres se cae a mitad de una transacción?** `withTransaction`
  hace `ROLLBACK` en el `catch` y libera el cliente en el `finally` — nunca
  queda una conexión colgada ni datos a medias.
- **¿Por qué 409 y no 422 para el email duplicado?** Ver
  `docs/11-decisiones-tecnicas.md` — resumen: 422 es "tu request está mal
  formado", 409 es "tu request está bien formado pero choca con el estado
  actual del servidor". Un email duplicado es lo segundo.
