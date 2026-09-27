# 05 - POSTGRESQL Y `pg`

Este proyecto no usa un ORM (Prisma, TypeORM, Sequelize) a propósito — para
una prueba de live coding, SQL a mano con `pg` es más fácil de razonar en
15 minutos que aprender la API de un ORM que no conoces. `PgContactRepository`
(`backend/src/repositories/pg-contact.repository.ts`) es el único archivo
que sabe que existe `pg`.

## `Pool` vs `Client`

```ts
// backend/src/db/pool.ts
export function createPool(): Pool {
  return new Pool({ connectionString: env.DATABASE_URL });
}
```

- **`Client`** es una única conexión TCP a Postgres.
- **`Pool`** mantiene varias conexiones abiertas y las reparte entre
  requests concurrentes — abrir una conexión nueva por request sería
  carísimo (handshake TCP + autenticación en cada query). `pool.query(...)`
  toma una conexión libre del pool, la usa, y la devuelve sola.

Un único `Pool` para toda la app (creado en `server.ts`, pasado al
`container`) — nunca se crea uno por request.

## Queries parametrizadas — la única defensa real contra inyección SQL

```ts
await this.pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
```

`$1`, `$2`... son placeholders — `pg` los manda al servidor por separado del
SQL, nunca concatenados como texto. **Nunca** se construye una query con
interpolación de strings (`` `WHERE id = '${id}'` ``): eso es exactamente
lo que permite inyección SQL.

### La excepción: identificadores no se pueden parametrizar

`ORDER BY $1` no funciona — los placeholders son para *valores*, no para
nombres de columna. Por eso el orden de la lista pasa por una whitelist:

```ts
// backend/src/repositories/pg-contact.repository.ts
const SORT_COLUMNS: Record<ContactSort['sort'], string> = {
  first_name: 'first_name',
  last_name: 'last_name',
  created_at: 'created_at',
};
// ...
const column = SORT_COLUMNS[sort.sort]; // sort.sort ya viene validado por Zod como uno de esos 3 valores
const sql = `ORDER BY ${column} ${direction}`;
```

Como `sort.sort` ya pasó por el schema de Zod (`z.enum([...])`) antes de
llegar aquí, solo puede ser uno de esos tres valores — el `Record` es una
capa extra de seguridad (defensa en profundidad), no la única.

## Evitar N+1: cargar teléfonos en una sola query

```ts
// Ingenuo (N+1): una query de teléfonos POR CADA contacto de la página
for (const contact of contacts) {
  contact.phones = await pool.query('SELECT * FROM phones WHERE contact_id = $1', [contact.id]);
}

// Lo que hace este repo: una sola query para TODOS los contactos de la página
const result = await this.pool.query('SELECT * FROM phones WHERE contact_id = ANY($1) ORDER BY contact_id, position', [contactIds]);
```

`ANY($1)` con un array de ids en un solo parámetro reemplaza a "una query
por contacto" — con 10 contactos en la página, son 2 queries totales (no
11). `groupPhonesByContact` (`repositories/contact-row.mapper.ts`) arma el
`Map<contactId, Phone[]>` a partir de esa única query.

## Transacciones

```ts
// backend/src/db/transaction.ts
export async function withTransaction<T>(pool: Pool, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

Se usa al crear/reemplazar un contacto: insertar el contacto y sus
teléfonos son dos (o más) `INSERT` — si el segundo falla, **no** debe
quedar un contacto sin teléfonos a medio guardar. `BEGIN`/`COMMIT`/
`ROLLBACK` hacen que todas las queries dentro de `fn` se confirmen juntas o
ninguna. `client.release()` en el `finally` devuelve la conexión al pool
sin importar qué pasó — olvidarlo agota el pool poco a poco (una fuga de
conexiones clásica).

## Paginación con `LIMIT`/`OFFSET`

```sql
SELECT * FROM contacts ORDER BY first_name ASC LIMIT $1 OFFSET $2
```

`OFFSET = (page - 1) * limit`. Es la forma más simple de paginar y funciona
bien para listas de tamaño moderado (miles de filas). Para *millones* de
filas, `OFFSET` se vuelve lento (Postgres tiene que recorrer y descartar
todas las filas anteriores) — ahí se usaría paginación por cursor (`WHERE
id > $último_id_visto ORDER BY id LIMIT $n`), que no necesita saltarse
nada. No hizo falta aquí, pero es la respuesta correcta si te preguntan
"¿cómo paginarías una tabla de 50 millones de filas?".

## Índices en este esquema

```sql
CREATE UNIQUE INDEX contacts_email_unique ON contacts (LOWER(email));
CREATE INDEX phones_contact_id_idx ON phones (contact_id);
```

- El índice único sobre `LOWER(email)` es lo que hace que
  `WHERE LOWER(email) = LOWER($1)` sea rápido (sin él, sería un escaneo
  completo de la tabla) **y** es lo que le pide a Postgres rechazar un
  segundo contacto con el mismo email (case-insensitive) — la fuente de
  verdad del `409 Conflict`, no solo el chequeo en la aplicación.
- El índice sobre `phones.contact_id` acelera exactamente la query `ANY($1)`
  de la sección anterior.

## El error `23505` — violación de restricción única

```ts
// backend/src/middlewares/error-handler.ts
if (isPgUniqueViolation(err)) { // err.code === '23505'
  res.status(409).json({ message: 'El correo ya está registrado.' });
}
```

`23505` es el código de error de Postgres (no de HTTP) para "violaste una
restricción `UNIQUE`". El servicio ya comprueba `emailExists()` **antes**
de insertar (para dar un mensaje claro), pero siempre puede haber una
carrera (dos requests casi simultáneas pasan el chequeo y ambas intentan
insertar) — por eso `errorHandler` también atrapa el `23505` como una red
de seguridad final.

## El runner de migraciones (`scripts/db-migrate.ts`)

```bash
pnpm db:migrate                    # aplica las pendientes
pnpm db:migrate -- --fresh         # borra las tablas y las vuelve a crear
pnpm db:migrate -- --fresh --seed  # + carga los 8 contactos de ejemplo + usuario demo
```

Una tabla `schema_migrations` guarda qué archivos `.sql` de `db/migrations/`
ya se aplicaron — correr el comando dos veces no vuelve a ejecutar lo que
ya corrió (idempotente). `--seed` también es idempotente (salta un contacto
si su email ya existe) porque el contenedor `api` lo corre en **cada**
arranque, no solo la primera vez (ver `docs/07-docker-desktop.md`).

## `gen_random_uuid()` sin extensiones

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

Desde Postgres 13, esta función viene en el núcleo — no hace falta
`CREATE EXTENSION "uuid-ossp"` ni `pgcrypto` como en versiones más viejas.
Este proyecto usa Postgres 16, así que no hay ninguna extensión que
instalar.
