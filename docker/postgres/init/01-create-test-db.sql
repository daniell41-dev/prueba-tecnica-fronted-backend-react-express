-- Se ejecuta una sola vez, la primera vez que el volumen `pgdata` está vacío
-- (así funciona /docker-entrypoint-initdb.d en la imagen oficial de
-- Postgres). Crea la base que usan los tests de integración del backend
-- (`pnpm test:integration`), separada de `contacts` para no mezclar datos
-- de desarrollo con datos de prueba.
CREATE DATABASE contacts_test;
