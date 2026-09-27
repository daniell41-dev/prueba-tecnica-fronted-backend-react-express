# Kata 4 — Corregir un bug y escribir su test

Tres bugs reales (del tipo que de verdad se cuela en código así), uno por
uno. Cada parche mete el bug **y quita el test que lo atraparía** — la
suite sigue en verde después de aplicarlo, igual que pasaría si ese bug
llegara a producción sin que nadie lo note. Tu trabajo, para cada uno:

1. **Reprodúcelo manualmente** (un `curl`, o leyendo el código) para
   confirmar que existe y entender exactamente cuándo se dispara.
2. **Escribe el test que debería atraparlo** — con el bug puesto, ese test
   tiene que fallar (rojo). Si te da verde con el bug puesto, tu test no
   está probando lo que crees.
3. **Arréglalo.**
4. **Confirma que tu test (y toda la suite) pasa** (verde).

No mires la solución dentro del `.patch` antes de intentarlo — ábrelo
después, para comparar tu fix con el original.

---

## Bug 1 — Paginación con desplazamiento incorrecto

```bash
git checkout -b practica/bug-offset
git apply docs/ejercicios/bugs/01-offset-paginacion.patch
```

**Síntoma a reproducir**: pide la página 1 con `limit=2` de una lista con
3 o más contactos — el primer contacto de la lista "desaparece" (la
página salta las primeras filas en vez de empezar desde el principio).

<details>
<summary>Pista (ábrela solo si te atoraste)</summary>

Está en `PgContactRepository.findMany` — revisa la fórmula de `OFFSET`.
¿Qué debería pasar cuando `page = 1`?
</details>

---

## Bug 2 — `DELETE` de un contacto que no existe no responde 404

```bash
git checkout -b practica/bug-delete
git apply docs/ejercicios/bugs/02-delete-sin-404.patch
```

**Síntoma a reproducir**:
```bash
curl -i -X DELETE http://localhost:3000/api/contacts/6f9619ff-8b86-d011-b42d-00cf4fc964ff \
  -H "Authorization: Bearer $TOKEN"
```
Debería responder `404` (no existe ese contacto) — con el bug puesto,
responde `204` igual, como si hubiera borrado algo.

<details>
<summary>Pista</summary>

`ContactRepository.delete()` ya devuelve un `boolean` (si existía o no) —
¿el `service` está usando ese valor para algo?
</details>

---

## Bug 3 — El middleware de auth no verifica la firma del token

Este es el más serio de los tres: un bug de **seguridad**, no solo de
comportamiento incorrecto.

```bash
git checkout -b practica/bug-jwt
git apply docs/ejercicios/bugs/03-jwt-decode-sin-verify.patch
```

**Síntoma a reproducir**: un JWT expirado, o firmado con un secreto
distinto al del servidor, **sigue autenticando** en vez de responder
`401`. Pruébalo:

```bash
node -e "console.log(require('jsonwebtoken').sign({sub:'x', email:'atacante@example.com'}, 'lo-que-sea'))"
# copia el token que imprime y pruébalo contra /api/auth/me:
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer <ese-token>"
```

Con el bug puesto, responde `200` con `{"user":{"id":"x","email":"atacante@example.com"}}`
— **cualquiera** puede forjar un token sin conocer `JWT_SECRET`.

<details>
<summary>Pista</summary>

`jwt.verify(token, secret)` comprueba la firma y la expiración.
`jwt.decode(token)` solo *lee* el payload — no comprueba nada. ¿Cuál usa
`requireAuth` ahora?
</details>

---

## Al terminar cada bug

```bash
pnpm --dir backend lint && pnpm --dir backend typecheck && pnpm --dir backend test
git diff docs/ejercicios/bugs/0X-....patch   # compara tu fix con el original
git checkout main
git branch -D practica/bug-...
```

## La lección de fondo

Los tres bugs comparten un patrón: el código *parece* correcto a simple
vista (compila, no lanza, la mayoría de los casos funcionan) — solo un
test que ejercite específicamente el caso borde (`page=1`, un id que no
existe, un token forjado) lo revela. Esa es la razón real detrás de
"escribe un test para cada bug que arregles": no es burocracia, es la
única forma de que ese mismo bug no vuelva la próxima vez que alguien
toque ese archivo.
