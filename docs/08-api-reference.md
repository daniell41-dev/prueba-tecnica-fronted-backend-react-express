# 08 - REFERENCIA DE LA API

Todas las rutas están bajo `/api`. Todas las respuestas son JSON
(`Content-Type: application/json; charset=utf-8`), salvo el `204` de
`DELETE`, que no tiene cuerpo. CORS está habilitado según `CORS_ALLOWED_ORIGIN`.

## Modelo de contacto

```jsonc
{
  "id": "9f1c2e3a-...",
  "first_name": "María",
  "last_name": "González",
  "email": "maria.gonzalez@atlantis.mx",
  "company": "Atlantis Labs",       // string | null
  "favorite": true,
  "phones": [
    { "type": "mobile", "number": "5512345678" }  // number: siempre 10 dígitos
  ],
  "created_at": "2026-01-12T10:30:00.000Z",  // ISO-8601
  "updated_at": "2026-01-12T10:30:00.000Z"
}
```

`type` de teléfono ∈ `mobile | home | work | other`.

---

## Auth

### `POST /api/auth/login`

**Body**: `{ "email": string, "password": string }`

**200** → `{ "token": string, "user": { "id": string, "email": string } }`

**401** → `{ "message": "Credenciales inválidas." }` (mismo mensaje si el
email no existe o si la contraseña no coincide — no se filtra cuál de las
dos cosas falló).

**422** → si `email`/`password` vienen vacíos.

### `GET /api/auth/me`

Requiere `Authorization: Bearer <token>`.

**200** → `{ "user": { "id": string, "email": string } }`
**401** → si falta el token, es inválido o expiró.

---

## `GET /api/contacts`

Lista contactos, paginados y filtrados.

| Query param | Tipo | Default | Notas |
|---|---|---|---|
| `page` | number | `1` | mínimo 1 |
| `limit` | number | `10` | 1 a 50 |
| `search` | string | — | busca en nombre, apellido, email y empresa (`ILIKE`) |
| `favorite` | `"true"` \| `"false"` | — | si se omite, no filtra |
| `sort` | `first_name` \| `last_name` \| `created_at` | `first_name` | |
| `order` | `asc` \| `desc` | `asc` | |

**200**

```json
{
  "contacts": [ { "...": "ver Modelo de contacto" } ],
  "meta": { "page": 1, "limit": 10, "total": 8, "total_pages": 1 }
}
```

**422** — si algún query param no cumple (p. ej. `limit=999`).

```bash
curl "http://localhost:3000/api/contacts?search=ana&favorite=true&sort=last_name&order=desc"
```

## `GET /api/contacts/stats`

Agregados calculados con `Promise.all` (tres queries en paralelo).

**200**

```json
{ "total": 8, "favorites": 3, "top_companies": [{ "company": "Atlantis Labs", "count": 1 }] }
```

## `GET /api/contacts/:id`

**200** → `{ "contact": { "...": "ver Modelo de contacto" } }`

**404** — no existe un contacto con ese id, **o** el `id` no tiene forma de
UUID (nunca dispara un `500` por un id mal formado).

```json
{ "message": "No existe un contacto con id \"...\"." }
```

## `POST /api/contacts`

Requiere `Authorization: Bearer <token>`.

**Body**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `first_name` | string | sí | no vacío, máx. 60, solo letras/acentos/espacios/`'`/`-` |
| `last_name` | string | sí | igual que `first_name` |
| `email` | string | sí | formato válido, único (case-insensitive) |
| `company` | string \| null | no | máx. 80; por defecto `null` |
| `favorite` | boolean | no | por defecto `false` |
| `phones` | array | no | 0 a 10 elementos; por defecto `[]` |
| `phones[].type` | string | no | `mobile\|home\|work\|other`; por defecto `mobile` |
| `phones[].number` | string | sí (si hay teléfono) | 10 dígitos tras normalizar; acepta `+52`, espacios, guiones, puntos, paréntesis; sin duplicados en el mismo contacto |

`id`, `created_at`, `updated_at` los genera el servidor.

**201** — header `Location: /api/contacts/{id}` + el contacto creado.

```json
{ "contact": { "...": "ver Modelo de contacto" } }
```

**422** — algún campo no pasa las reglas. `errors` agrupa mensajes por
campo; los teléfonos usan la clave `phones.<índice>.<campo>`.

```json
{
  "message": "Los datos enviados no son válidos.",
  "errors": { "email": ["Debe ser un correo electrónico válido."], "phones.0.number": ["Debe tener 10 dígitos."] }
}
```

**400** — el body no es JSON válido. **401** — sin token o token inválido.
**409** — el email ya está registrado.

```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{
    "first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com",
    "phones": [{ "type": "mobile", "number": "+52 55 1111 2222" }]
  }'
```

## `PUT /api/contacts/:id`

Reemplazo completo (mismo body y reglas que `POST`) — los teléfonos que no
se incluyan **se pierden** (se reemplazan por completo).

**200** → el contacto actualizado. **404**, **422**, **400**, **401**,
**409** — igual que `POST`.

## `PATCH /api/contacts/:id`

Actualización parcial — solo se tocan los campos presentes en el body.
`company: null` explícito borra la empresa; omitir `company` no la toca.

```bash
curl -X PATCH http://localhost:3000/api/contacts/$ID \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"favorite": true}'
```

**200**, **404**, **422**, **401** — igual criterio que `POST`/`PUT`.

## `DELETE /api/contacts/:id`

Elimina un contacto (y sus teléfonos, en cascada).

**204** — sin cuerpo. **404** — no existe. **401** — sin token.

## `POST /api/contacts/import`

Importa contactos desde una API externa (randomuser.me). Requiere token.

**Body**: `{ "count": number }` (1 a 20).

**200** → `{ "imported": number, "failed": number }` — un contacto que
falla (p. ej. email duplicado) no tumba a los demás (`Promise.allSettled`).

**422** — `count` fuera de rango. **502** — el servicio externo no
respondió bien (o no se pudo contactar, tras un reintento). **504** — el
servicio externo tardó demasiado (timeout).

---

## `GET /api/health`

**200** → `{ "status": "ok", "db": "up" }`
**503** → `{ "status": "error", "db": "down" }` (Postgres no responde).

## Otros códigos

| Código | Cuándo |
|---|---|
| `404` | Ruta inexistente (`{"message": "La ruta solicitada no existe."}`) |
| `500` | Error inesperado (`APP_DEBUG=true` incluye el detalle; nunca en producción) |

> ⚠️ A diferencia de la versión PHP de ATL, esta API **no** distingue un
> `405 Method Not Allowed` de un `404` — ver `docs/11-decisiones-tecnicas.md`.
