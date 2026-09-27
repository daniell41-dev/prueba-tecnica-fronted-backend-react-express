-- Esquema PostgreSQL. Se aplica con `pnpm db:migrate` (CREATE TABLE IF NOT
-- EXISTS: idempotente). `gen_random_uuid()` es una función del core de
-- Postgres desde la versión 13 — no requiere ninguna extensión.

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT NULL,
    favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email único, insensible a mayúsculas/minúsculas (Ana@x.com == ana@x.com).
CREATE UNIQUE INDEX IF NOT EXISTS contacts_email_unique ON contacts (LOWER(email));

CREATE TABLE IF NOT EXISTS phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    number TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS phones_contact_id_idx ON phones (contact_id);

-- Usuarios para autenticación (proteger los endpoints de escritura de contactos).
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
