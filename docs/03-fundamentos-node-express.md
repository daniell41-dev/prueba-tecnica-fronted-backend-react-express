# 03 - FUNDAMENTOS DE NODE Y EXPRESS

Este documento asume que sabes programar pero nunca (o casi nunca) tocaste
Node/Express en serio. Todo lo que explica está en código real dentro de
`backend/src/` — cada sección apunta al archivo exacto.

## 1. El event loop, en corto

Node corre en **un solo hilo** de JavaScript. Nunca bloquea ese hilo
esperando I/O (una query a la base, una llamada HTTP): en vez de eso,
delega la operación, sigue atendiendo otras requests, y cuando la operación
termina, vuelve a tu callback/`await`. Por eso:

- Nunca hay código como `sleep()` bloqueante en un servidor Node real.
- Una query lenta a Postgres no congela las demás requests — pero **si
  escribes código síncrono pesado** (un bucle enorme sin await), sí las
  congela, porque eso sí ocupa el único hilo.
- Esto es lo que hace que `Promise.all`/`Promise.allSettled` (sección 4)
  sean tan naturales aquí: lanzar varias operaciones de I/O a la vez es
  "gratis" en comparación con hacerlas una por una.

## 2. ESM: por qué los imports llevan `.js`

Este proyecto usa **ESM** (`"type": "module"` en `package.json`,
`import`/`export`) en vez de CommonJS (`require`). Una particularidad: en
TypeScript+ESM, los imports **relativos** llevan la extensión `.js` aunque
el archivo real sea `.ts`:

```ts
import { env } from '../config/env.js'; // el archivo es env.ts, pero se importa como .js
```

Esto no es un error: Node resuelve módulos ESM por el nombre de archivo que
existirá **después de compilar** (`tsc` genera `env.js` a partir de
`env.ts`), no por el nombre del archivo fuente. `tsx` (que usamos en
desarrollo) entiende esta convención y resuelve directo al `.ts`.

## 3. La cadena de middlewares — el corazón de Express

Un middleware es una función `(req, res, next) => void`. `app.use(...)` los
encadena, en el orden en que se registran:

```ts
// backend/src/app.ts
app.use(helmet());                 // 1. headers de seguridad
app.use(cors({ ... }));            // 2. CORS
app.use(express.json());           // 3. parsea el body JSON → req.body
app.use(requestLogger);            // 4. loguea método/ruta/status/duración
app.use('/api', apiRoutes(deps));  // 5. tus rutas de negocio
app.use(notFoundHandler);          // 6. nada anterior respondió → 404
app.use(errorHandler);             // 7. algo anterior lanzó → traduce a HTTP
```

Cada middleware decide: o llama a `next()` (pasa el control al siguiente),
o responde directamente (`res.json(...)`), o lanza/pasa un error. El
**orden importa**: si `express.json()` fuera después de las rutas,
`req.body` llegaría vacío a los controllers.

### El middleware de errores es especial

`errorHandler` (`middlewares/error-handler.ts`) tiene **4 parámetros**
`(err, req, res, next)` en vez de 3. Esa firma es la señal que Express usa
para reconocerlo como manejador de errores — no importa el nombre de la
función ni dónde se define en el archivo, solo que se registre **al final**
de la cadena. Solo atrapa errores de middlewares registrados *antes* que
él.

## 4. Validar, no re-validar: `validateBody`

```ts
// backend/src/middlewares/validate-body.ts
export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body); // lanza ZodError si algo no cumple
    next();
  };
}
```

Si `schema.parse` lanza, Express **atrapa automáticamente** ese error
síncrono y lo manda a `errorHandler` — no hace falta un `try/catch` a mano
en cada ruta. Este es un comportamiento de Express desde siempre (no es
exclusivo de la v5): un middleware o handler síncrono que lanza dispara
`next(err)` solo.

## 5. Express 5 vs Express 4: por qué los controllers no tienen `try/catch`

Donde Express 4 y 5 sí difieren es en código **asíncrono**. En Express 4,
si un handler `async` rechaza una promesa, Express **no** lo atrapa —
necesitabas envolver cada handler en un `asyncHandler` a mano o la app se
quedaba colgada sin responder. **Express 5 arregló esto**: si el handler
devuelve una promesa rechazada, la reenvía sola a `errorHandler`.

```ts
// backend/src/controllers/contacts.controller.ts
show = async (req: Request, res: Response): Promise<void> => {
  const contact = await this.service.find(this.requireUuid(req.params.id));
  // si find() rechaza (NotFoundError), Express 5 lo manda solo a errorHandler
  res.json({ contact: toContactDto(contact) });
};
```

Por eso ningún controller de este repo tiene `try/catch`: confían en que
Express 5 hace ese trabajo. Si estuvieras en Express 4, cada uno de estos
métodos necesitaría un wrapper.

## 6. `Promise.all` vs `Promise.allSettled` vs secuencial

| | Cuándo usarlo | Ejemplo en este repo |
|---|---|---|
| **Secuencial** (`await` uno tras otro) | El segundo depende del resultado del primero | `services/contacts.service.ts#replace`: primero busca el contacto, luego valida el email |
| **`Promise.all`** | Necesitas *todas* las operaciones, y si una falla no tiene sentido seguir | `list()`: contar y paginar son independientes pero ambos hacen falta para la respuesta. `stats()`: total + favoritos + top empresas |
| **`Promise.allSettled`** | Cada operación es independiente y una falla individual **no** debe tumbar a las demás | `contact-import.service.ts#importRandom`: si un contacto importado tiene email duplicado, los otros 4 se crean igual |

```ts
// Promise.all: las dos queries se disparan a la vez, no una tras otra
const [contacts, total] = await Promise.all([
  this.repository.findMany(filters, sort, pagination),
  this.repository.count(filters),
]);

// Promise.allSettled: 5 creaciones en paralelo, cuento cuántas funcionaron
const results = await Promise.allSettled(people.map((p) => this.createFromRandomUser(p)));
const imported = results.filter((r) => r.status === 'fulfilled').length;
```

Un error común: usar `Promise.all` cuando en realidad quieres `allSettled`
— con `all`, **una sola** promesa rechazada tira todo el `Promise.all`
abajo (las demás ni se esperan, sus resultados se pierden).

## 7. Llamadas externas: timeout, reintento y mapeo de errores

`clients/random-user.client.ts` es el ejemplo completo de "async/await +
manejo de errores en llamadas externas":

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(env.RANDOM_USER_TIMEOUT_MS) });
```

- **Timeout**: `AbortSignal.timeout(ms)` cancela el `fetch` si tarda
  demasiado — sin esto, una API externa caída podría dejar la request
  colgada indefinidamente.
- **Un reintento**: si la llamada falla por red o responde con un status
  no-2xx, se reintenta **una vez**. Un payload con forma inválida **no** se
  reintenta — no es un problema transitorio, repetir no lo arregla.
- **Mapeo a HTTP**: nunca deja que un error de red se filtre como un `500`
  genérico. Lo traduce a `ExternalServiceError` (`502` si el servicio
  respondió mal o no se pudo contactar, `504` específicamente si fue un
  timeout), que `errorHandler` ya sabe traducir.

## 8. Graceful shutdown

```ts
// backend/src/server.ts
function shutdown(signal: string): void {
  server.close(() => {              // deja de aceptar conexiones nuevas
    void pool.end().finally(() => process.exit(0)); // cierra Postgres, luego sale
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
```

Cuando Docker detiene un contenedor (o presionas Ctrl+C), manda `SIGTERM`.
Sin este manejo, el proceso muere de inmediato y una request en curso o una
transacción a medias se corta abruptamente. Con él, el servidor termina lo
que está haciendo antes de cerrar la conexión a la base.
