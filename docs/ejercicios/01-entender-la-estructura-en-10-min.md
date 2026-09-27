# Kata 1 — Entender la estructura en 10 minutos

Esto es exactamente lo que te van a pedir al arrancar una entrevista de
live coding: "te comparto este repo, dale una vuelta y cuéntame qué hace
antes de que empecemos a pedirte cosas." Practica el recorrido en voz alta,
como si el entrevistador te estuviera escuchando — di lo que ves, no solo
lo leas para ti.

## El recorrido guiado (sigue este orden)

1. **`package.json` / `CLAUDE.md`** (30 s) — ¿qué gestor de paquetes,
   qué scripts hay (`dev`, `build`, `test`, `lint`)? Aquí: `pnpm`, y
   backend/frontend son dos paquetes independientes.
2. **`README.md`** (1 min) — qué hace la app, cómo se levanta.
3. **`src/server.ts` → `src/app.ts` → `src/container.ts`** (2 min) — el
   punto de entrada. Lee en ese orden exacto: `server.ts` arma el pool y el
   container y arranca; `app.ts` es la cadena de middlewares + dónde
   cuelgan las rutas; `container.ts` es quién construye qué (el
   "composition root" — aquí ves de un vistazo toda la arquitectura en 20
   líneas).
4. **`src/routes/` → `src/controllers/`** (2 min) — el mapa completo de
   endpoints. En 30 segundos sabes cuántas rutas hay y cuáles necesitan
   token (`requireAuth` en la definición de la ruta).
5. **Un controller → su service → su repository** (2 min) — sigue **una
   sola** ruta de punta a punta (p. ej. `POST /contacts`): controller →
   `ContactsService.create` → `ContactRepository` (interfaz) →
   `PgContactRepository`. Esto te da el patrón completo; los demás
   endpoints son variaciones del mismo.
6. **`src/schemas/`** (1 min) — cómo se valida. Basta con abrir
   `contact.schema.ts` y ver los nombres de los campos.
7. **`tests/`** (1 min) — ¿cómo están organizados? (`unit`/`api`/
   `integration`), ¿usan una base de datos real o en memoria?
8. **`db/migrations/`** (30 s) — el esquema de la base, en SQL crudo.

## El guion para narrarlo (adapta, no memorices)

> "Es una API REST de contactos en Express con TypeScript. El punto de
> entrada es `server.ts`, que arma un pool de Postgres, un 'container' con
> todas las dependencias, y arranca. La arquitectura está en capas:
> controllers traducen HTTP, services tienen la lógica de negocio,
> repositories hablan con la base detrás de una interfaz — así que si
> quisiera cambiar de Postgres a otra cosa, solo tocaría una clase. La
> validación es con Zod, en `schemas/`. Hay JWT para las rutas de
> escritura. Los tests están separados en tres niveles: unitarios y de API
> corren con repositorios en memoria — rápidos, sin Docker — y los de
> integración sí van contra Postgres real."

## Preguntas que probablemente te hagan después de esto (con respuesta corta)

- **"¿Por qué esta arquitectura en capas y no todo en el controller?"** —
  Separación de responsabilidades: el controller no sabe de SQL, el
  service no sabe de HTTP, el repository es la única capa que sabe de
  `pg`. Facilita testear cada capa por separado y cambiar una sin tocar
  las demás.
- **"¿Dónde validarías un campo nuevo?"** — En el schema de Zod
  correspondiente (`schemas/contact.schema.ts`), no en el controller ni en
  el repository.
- **"¿Qué pasa si Postgres se cae?"** — `GET /api/health` lo refleja
  (`503`); cualquier otra ruta que necesite la base propagaría el error de
  `pg` hasta `errorHandler`, que respondería `500`.

## Autoevaluación

- [ ] Hiciste el recorrido completo en 10 minutos o menos, sin ayuda.
- [ ] Pudiste explicar el flujo de una request de punta a punta sin abrir
      más de 4 archivos.
- [ ] Supiste responder, sin ayuda, las tres preguntas de arriba.

Si algo te costó, vuelve a `docs/02-arquitectura-backend.md` y repite el
recorrido al día siguiente.
