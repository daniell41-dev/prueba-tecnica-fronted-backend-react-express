# Kata 3 — Agregar un middleware JWT

## Preparación

```bash
git checkout -b practica/jwt
git apply docs/ejercicios/practica/quitar-jwt.patch
pnpm --dir backend test   # varios "responde 401 sin token" van a fallar (ahora responden 200)
```

El parche borra `src/middlewares/require-auth.ts` y su test, y quita su
uso de las rutas — todo lo demás (login, JWT_SECRET en la config, el tipo
`AuthenticatedUser`) sigue intacto.

## Enunciado

Reconstruye `requireAuth`: un middleware que exige
`Authorization: Bearer <token>` en las rutas de escritura de contactos
(`POST`/`PUT`/`PATCH`/`DELETE`/`import`) y en `GET /api/auth/me`.

## Criterios de aceptación

- [ ] Sin header, o con un header que no empiece con `Bearer `, responde
      `401`.
- [ ] Con un JWT inválido, expirado, o firmado con otro secreto, responde
      `401` — **nunca** un `500`.
- [ ] Con un JWT válido, la request sigue normal y `req.user` queda
      poblado con `{ id, email }` para que el controller lo use.
- [ ] `pnpm --dir backend test` en verde.

## Pasos sugeridos (25-35 min)

1. **El middleware** (`src/middlewares/require-auth.ts`):
   ```ts
   export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
     const header = req.headers.authorization;
     if (!header?.startsWith('Bearer ')) {
       next(new UnauthorizedError('Falta el token de autenticación.'));
       return;
     }
     const token = header.slice('Bearer '.length);
     try {
       const payload = jwt.verify(token, env.JWT_SECRET); // NUNCA jwt.decode — no comprueba firma ni expiración
       // ... validar la forma del payload, poblar req.user, next()
     } catch {
       next(new UnauthorizedError('Token inválido o expirado.'));
     }
   }
   ```
   El error más común en esta kata (y un bug de seguridad real, ver kata 4,
   bug 3) es usar `jwt.decode` en vez de `jwt.verify` — `decode` lee el
   payload sin comprobar la firma, así que **cualquiera** puede forjar un
   token válido con solo saber su forma.
2. **Ampliar el tipo `Request`** — revisa `src/types/express.d.ts`; ya
   declara `req.user?: AuthenticatedUser` (module augmentation). Si lo
   dejaste intacto, tu middleware ya puede escribir `req.user = ...` sin
   `any`.
3. **Aplicarlo en las rutas** — `src/routes/contacts.routes.ts` (las 5
   rutas de escritura) y `src/routes/auth.routes.ts` (`GET /me`).
4. **Corre los tests**: `tests/unit/require-auth.test.ts` (si lo
   recreaste) y los `responde 401 sin token` repartidos en
   `tests/api/*.test.ts`.

## Cuando termines

```bash
pnpm --dir backend lint && pnpm --dir backend typecheck && pnpm --dir backend test
git checkout main
git branch -D practica/jwt
```

## Variante: roles y `403`

Extiende el payload del JWT con un campo `role: 'admin' | 'user'`, y
agrega un segundo middleware `requireRole('admin')` que responda `403
Forbidden` (no `401`) si el usuario autenticado no tiene el rol
necesario. Pista: `403` es "sé quién eres, pero no puedes hacer esto";
`401` es "no sé quién eres".
