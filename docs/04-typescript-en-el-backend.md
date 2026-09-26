# 04 - TYPESCRIPT EN EL BACKEND

## `tsconfig.json`, comentado

```jsonc
{
  "compilerOptions": {
    "target": "ES2023",             // qué tan "moderno" puede ser el JS de salida (Node 22 lo soporta todo)
    "module": "NodeNext",            // usa la resolución de módulos de Node (ESM real, no "TS a su manera")
    "moduleResolution": "NodeNext",  // hermano del anterior — exige imports con extensión (ver doc 03, sección 2)
    "types": ["node"],               // sin esto, `process`, `Buffer`, etc. no existen para TS (TS 6 no los incluye por defecto)
    "strict": true,                  // activa todas las comprobaciones estrictas (no-implicit-any, etc.)
    "noUncheckedIndexedAccess": true // arr[0] es `T | undefined`, no `T` — te obliga a comprobar antes de usar
  }
}
```

`tsconfig.build.json` extiende este archivo y solo cambia `outDir`/`include`
para no meter los tests en el build de producción — evita duplicar todas
las demás opciones.

## `tsx` vs `tsc`: dos formas de correr TypeScript

- **`tsc`** compila `.ts` → `.js` de verdad, a disco (`pnpm build`). Lo que
  corre en producción (`node dist/server.js`) es JavaScript puro — no hay
  ningún paso de TypeScript en producción salvo el CLI de migraciones (ver
  `docs/11-decisiones-tecnicas.md`, "por qué el CLI de migraciones corre con
  `tsx` en el contenedor").
- **`tsx`** ejecuta `.ts` directo, sin generar archivos — transpila en
  memoria, en el momento. Se usa en desarrollo (`pnpm dev`, con
  `--watch` para reiniciar solo al guardar) y para scripts de un solo uso
  como `scripts/db-migrate.ts`.

Ninguno de los dos hace *type-checking* real en el camino feliz de
ejecución (`tsc` sin `--noEmit` sí, pero como parte de compilar; `tsx`
directamente no). Por eso `pnpm typecheck` (`tsc --noEmit`) es un paso
separado — corre en CI y antes de cada push, precisamente para atrapar
errores de tipos que ni `tsx` ni un `tsc build` fallido a medias
mostrarían con claridad.

## Tipar Express: `Request`, `Response`, y las 4 "genéricas"

```ts
import type { Request, Response } from 'express';

show = async (req: Request, res: Response): Promise<void> => { ... };
```

`Request` acepta hasta 4 parámetros de tipo genérico:
`Request<Params, ResBody, ReqBody, Query>`. Este proyecto no los usa
explícitamente (se apoya en `req.body as CreateContactBody` después de
`validateBody`) para no sobrecargar cada firma — es una simplificación
deliberada; en un proyecto donde el tipado de punta a punta importa más,
tipar `Request<{ id: string }, unknown, CreateContactBody>` evita el `as`.

### Ampliar `Request` con `req.user`

```ts
// backend/src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
```

Esto es **module augmentation**: le agrega una propiedad a un tipo que
viene de una librería externa (`express`), sin tocar su código. `requireAuth`
rellena `req.user` después de verificar el JWT; cualquier controller
protegido lo lee ya tipado, sin `any` ni `as`.

## Zod: el schema *es* el tipo

```ts
export const createContactSchema = z.object({
  first_name: nameSchema,
  email: emailSchema,
  // ...
});

export type CreateContactBody = z.infer<typeof createContactSchema>;
```

`z.infer<typeof schema>` deriva el tipo TypeScript **a partir** del schema
de validación — nunca se declaran por separado (evita que se desincronicen:
si agregas un campo al schema y olvidas el tipo, en TS clásico compilaría
igual con un tipo desactualizado; con `z.infer` es imposible que pase).

Los tests de `tests/unit/contact.schema.test.ts` prueban el schema
directamente (sin HTTP): `schema.safeParse(payload)` devuelve
`{ success, data }` o `{ success: false, error }`, sin lanzar — útil para
revisar varios casos sin `try/catch`.

## `unknown` en los `catch`, no `any`

```ts
} catch (error) {
  if (error instanceof ApiError && error.fieldErrors) { ... }
}
```

TypeScript moderno tipa lo que cae en un `catch` como `unknown` (no `any`)
por defecto — te obliga a comprobar el tipo (`instanceof`) antes de leer
sus propiedades. Es más código que `error.message` directo, pero evita el
típico `Cannot read properties of undefined` cuando lo que se lanzó no es
un `Error` (alguien hizo `throw 'algo'`, por ejemplo).

## `verbatimModuleSyntax` y `import type`

Con `verbatimModuleSyntax: true`, TypeScript exige que los imports que solo
se usan como **tipos** se marquen con `import type`:

```ts
import type { Request, Response } from 'express'; // solo se usan como anotación de tipo
import { Router } from 'express';                   // se usa en tiempo de ejecución (new Router())
```

Esto no es cosmético: sin `import type`, un bundler o `tsc` no siempre puede
saber con certeza si un import puede eliminarse del JS final (algunos
paquetes tienen side-effects al importarse) — declararlo explícito evita
ese ambigüedad y además documenta la intención. El lint
(`@typescript-eslint/consistent-type-imports`) lo hace cumplir.
