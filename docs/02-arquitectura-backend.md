# 02 - ARQUITECTURA DEL BACKEND

Reglas de estructura y arquitectura de `backend/`. Es el mismo esqueleto que
`prueba-tecnica-backend-atl` (PHP): capas `Http → Application → Domain ←
Infrastructure`, solo que aquí "Http" es Express y "Application" son
servicios de TypeScript. Si ya conoces esa versión, este documento es
sobre todo una tabla de traducción.

## 🧱 Estructura de carpetas

```
backend/
├── src/
│   ├── server.ts               # entrada: crea el pool, el container, la app, y arranca
│   ├── app.ts                  # createApp(deps): middlewares + rutas, sin tocar process.env
│   ├── container.ts            # composition root: pool → repos → services → controllers
│   ├── config/env.ts           # process.env validado con Zod (fail fast)
│   ├── db/{pool.ts,transaction.ts}
│   ├── domain/{contact.ts,user.ts}      # entidades + mapeos a DTO, sin dependencias de otras capas
│   ├── schemas/                # validación con Zod (equivalente de Validation/ en PHP)
│   ├── repositories/           # interfaces + implementación PgXRepository
│   ├── services/               # casos de uso (equivalente de Application/ en PHP)
│   ├── clients/                # llamadas a servicios externos (randomuser.me)
│   ├── controllers/            # traducen HTTP ↔ caso de uso, nada más
│   ├── routes/                 # mapa ruta → controller
│   ├── middlewares/            # validate-body, require-auth, error-handler, not-found, request-logger
│   ├── errors/app-error.ts     # AppError y subclases (statusCode asociado)
│   ├── utils/                  # funciones puras reutilizables (phone, uuid, pagination, zod-errors)
│   └── types/express.d.ts      # augmentation: req.user
├── db/{migrations,seeds}/       # schema SQL y datos de ejemplo
├── scripts/db-migrate.ts        # CLI de migraciones
└── tests/{unit,api,integration,helpers}/
```

### Reglas de dependencia (bajo acoplamiento)

```
Http  ──►  Application  ──►  Domain  ◄──  Infrastructure
(controllers)  (services)      │             (repositories/pg-*)
              │                └──────────► Validation (schemas/)
              └───────────────────────────► Domain (Contact, errores)
```

- `controllers/` solo conocen `services/` y `domain/` (para armar la
  respuesta). Nunca instancian `pg` ni escriben SQL.
- `services/` orquestan `schemas/` (implícito: reciben el body ya validado)
  y `repositories/ContactRepository` (la **interfaz**, nunca
  `PgContactRepository` directamente) — Dependency Inversion.
- `domain/` no depende de ninguna otra capa. Es el centro: entidades,
  funciones puras de transformación, y las excepciones de negocio.
- `repositories/pg-*` implementa las interfaces de `repositories/*.repository.ts`
  — es la única capa que sabe que existe `pg`.

### Flujo de una request

```
server.ts  (arma dependencias a mano, sin contenedor de DI — YAGNI)
   → app.ts: helmet → cors → express.json() → requestLogger → rutas
      → routes/*.ts: Router + middlewares (requireAuth, validateBody)     401 / 422
         → controllers/*.controller.ts                                    404 (uuid inválido)
            → services/*.service.ts                                       caso de uso
               → schemas/*.schema.ts (validación, ya corrida por el middleware)
               → repositories/ContactRepository (interfaz)
                  → PgContactRepository                                    SQL vía pg, transaccional
                     → db/pool.ts                                          Pool configurado por config/env.ts
   ← errorHandler traduce cualquier excepción a la respuesta HTTP correcta
```

## 🔁 Equivalencias con la versión PHP (ATL)

| PHP (`prueba-tecnica-backend-atl`) | Node (este repo) | Nota |
|---|---|---|
| `public/index.php` + `Kernel::handle()` | `app.ts` + `middlewares/error-handler.ts` | En Node el "kernel" es la cadena de middlewares de Express, no una clase |
| `Http/Router.php` | `express.Router()` (en `routes/*.ts`) | Express ya trae su router; no hace falta escribirlo |
| `Http/Controllers/ContactController.php` | `controllers/contacts.controller.ts` | Misma responsabilidad: traducir HTTP ↔ caso de uso |
| `Application/ContactService.php` | `services/contacts.service.ts` | Igual, Facade sobre validación + repositorio |
| `Validation/ContactValidator.php` + `Validator.php` | `schemas/contact.schema.ts` (Zod) | Zod reemplaza al validador escrito a mano |
| `Domain/Contact.php`, `Phone.php` | `domain/contact.ts` | Aquí son funciones + tipos, no clases con métodos |
| `Domain/ContactRepositoryInterface.php` | `repositories/contact.repository.ts` (interface) | Mismo patrón Repository |
| `Infrastructure/Persistence/PdoContactRepository.php` | `repositories/pg-contact.repository.ts` | PDO → `pg`; mismo cuidado con SQL parametrizado y N+1 |
| `Infrastructure/Database/Migrator.php` + `bin/migrate.php` | `scripts/db-migrate.ts` | Mismo CLI: `--fresh`, `--seed` |
| `Domain/Exception/*.php` | `errors/app-error.ts` | Jerarquía de errores con `statusCode` |
| `Support/PhoneNumber.php` | `utils/phone.ts` | Port línea por línea |
| `Support/Uid.php` | `node:crypto` → `randomUUID()` | Node ya lo trae en el core, no hace falta escribirlo |
| `Support/Config.php` | `config/env.ts` | Zod valida `process.env` una sola vez, al arrancar |
| — (no existía) | `middlewares/require-auth.ts` | Autenticación es nueva en esta versión (bonus de este repo) |
| — (no existía) | `clients/random-user.client.ts` | Llamada externa, también nueva |

## Simplificaciones intencionales frente a la versión PHP

- **Sin `405 Method Not Allowed` explícito.** El router de Express no separa
  "ruta existe con otro método" de "ruta no existe" tan fácil como el router
  a mano de PHP — cualquier combinación no registrada cae en el `404`
  genérico. Ver `docs/11-decisiones-tecnicas.md`.
- **El mensaje de un campo vacío puede repetirse dos veces** (p. ej.
  "Este campo es obligatorio." y "Solo se permiten letras...") porque Zod no
  corta la cadena de validaciones en la primera que falla, a diferencia del
  validador de PHP que sí lo hacía a mano. No afecta el contrato (sigue
  siendo un array de mensajes por campo), solo la cantidad de mensajes.
