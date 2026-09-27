# 09 - PROBAR CON POSTMAN Y EXPLORAR LA BASE CON DBEAVER

## Postman

1. Importa `postman/contacts-api.postman_collection.json` y
   `postman/local.postman_environment.json`.
2. Selecciona el environment **"Contacts API - Local"** (arriba a la
   derecha) — trae `base_url` apuntando a `http://localhost:3000`.
3. Corre la carpeta **"Auth"** primero — la request "Login (guarda token)"
   guarda el JWT en la variable de entorno `{{token}}`. Las requests
   protegidas de las otras carpetas ya mandan
   `Authorization: Bearer {{token}}` (header explícito, no depende de la
   configuración de auth heredada de la colección).
4. Corre **"Contactos"** de arriba hacia abajo — "Crear contacto" guarda
   `{{contact_id}}`, que usan "Obtener", "Actualizar favorito",
   "Reemplazar" y "Eliminar".
5. **"Casos de error"** se puede correr en cualquier momento (cada request
   es independiente): 422 (campos vacíos, teléfono inválido, duplicados),
   400 (JSON malformado), 401 (sin token / token inválido), 404 (contacto
   inexistente / id sin forma de UUID / ruta inexistente), 409 (email
   duplicado).

Cada request trae sus propios tests (pestaña *Tests*) que validan el
código de estado y la forma de la respuesta — corre la colección completa
con el botón **Run** (Collection Runner) para ver todo en verde de una vez.

### Desde la línea de comandos (Newman)

```bash
pnpm dlx newman run postman/contacts-api.postman_collection.json \
  -e postman/local.postman_environment.json
```

Útil para verificar la API sin abrir Postman, o como paso de un pipeline de
CI (aunque este repo usa Vitest/Supertest para eso en `pnpm test`).

## DBeaver

1. **Nueva conexión** → PostgreSQL.
2. Si levantaste el stack con `docker compose up`:
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Database**: `contacts` (o el valor de `POSTGRES_DB` en tu `.env`)
   - **Username** / **Password**: los de `POSTGRES_USER`/`POSTGRES_PASSWORD`
     en tu `.env` (por defecto `contacts` / `contacts`)
3. Prueba la conexión (**Test Connection**) y guarda.
4. Si además corriste los tests de integración del backend
   (`pnpm --dir backend test:integration`), verás también la base
   `contacts_test` — la crea el script de init de Postgres
   (`docker/postgres/init/01-create-test-db.sql`) la primera vez que el
   volumen está vacío.

### Consultas útiles para explorar los datos

```sql
-- Ver todos los contactos con sus teléfonos (join manual, como hace la app)
SELECT c.first_name, c.last_name, c.email, p.type, p.number
FROM contacts c
LEFT JOIN phones p ON p.contact_id = c.id
ORDER BY c.first_name, p.position;

-- Los mismos "top companies" que calcula GET /api/contacts/stats
SELECT company, COUNT(*) AS count
FROM contacts
WHERE company IS NOT NULL
GROUP BY company
ORDER BY count DESC, company ASC
LIMIT 5;

-- Confirmar el índice único case-insensitive sobre email
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'contacts';

-- El usuario demo (la contraseña está hasheada con bcrypt, no en texto plano)
SELECT email, password_hash, created_at FROM users;

-- Qué migraciones se aplicaron (y cuándo)
SELECT * FROM schema_migrations;
```

Esto es exactamente lo que un entrevistador puede pedirte: "abre DBeaver y
muéstrame cuántos contactos favoritos hay" o "confirma que el email es
único" — practica escribiendo estas queries a mano, no solo leyéndolas
aquí.
