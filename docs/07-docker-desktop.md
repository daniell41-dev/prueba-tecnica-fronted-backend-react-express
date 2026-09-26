# 07 - DOCKER DESKTOP: CÓMO SE CONECTA Y FUNCIONA TODO

Esta guía asume que abres **Docker Desktop** y quieres entender el stack
como si fuera un proyecto real en el trabajo: quién habla con quién, por
qué puerto, y qué hacer cuando algo no arranca. Si nunca usaste Docker,
lee primero la sección 1; si ya sabes qué es un contenedor, salta a la 3.

## 1. Conceptos, antes de tocar nada

- **Imagen**: una plantilla de solo lectura con el sistema de archivos que
  necesita tu app (Node instalado, tu código copiado, dependencias
  instaladas). Se construye una vez con `docker build` (o `docker compose
  build`) a partir de un `Dockerfile`.
- **Contenedor**: una imagen *corriendo* — un proceso aislado con su propio
  sistema de archivos, su propia red, pero compartiendo el kernel del
  sistema anfitrión (por eso son mucho más livianos que una máquina
  virtual completa).
- **Volumen**: almacenamiento que **sobrevive** a que el contenedor se
  borre y se recree. Sin un volumen, los datos de Postgres desaparecerían
  cada vez que reconstruyes el contenedor `db`.
- **Red (network)**: los contenedores de un mismo `docker-compose.yml` se
  conectan a una red privada donde se resuelven **por nombre de servicio**
  (DNS interno de Docker) — nunca por IP fija.
- **Puerto publicado vs interno**: un contenedor escucha en un puerto
  *dentro* de su propia red (p. ej. la API en el `3000` interno). Para que
  tu navegador (que vive *fuera* de esa red) pueda llegar, el
  `docker-compose.yml` **publica** ese puerto al host (`"3000:3000"`,
  `host:contenedor`).
- **Compose**: un archivo (`docker-compose.yml`) que describe *varios*
  contenedores relacionados (nuestros `db`, `api`, `web`) como un solo
  "proyecto", con sus redes, volúmenes y dependencias entre ellos.

## 2. Levantar el stack, paso a paso

1. Abre Docker Desktop y espera a que el ícono de la ballena diga "Docker
   Desktop is running".
2. En una terminal, en la raíz del repo:
   ```bash
   cp .env.example .env      # ajusta JWT_SECRET si quieres uno propio
   docker compose up --build
   ```
3. La primera vez tarda un par de minutos (descarga las imágenes base de
   Node/Postgres/nginx e instala dependencias). Vas a ver los logs de los
   tres contenedores entrelazados en la misma terminal.
4. Espera a ver algo como `API escuchando en http://localhost:3000` — ahí
   ya puedes abrir <http://localhost:8080> en el navegador.
5. Para detenerlo: `Ctrl+C`, y `docker compose down` para eliminar los
   contenedores (los **datos** de Postgres sobreviven, están en el volumen
   `pgdata` — `docker compose down -v` si también quieres borrarlos).

## 3. Recorrido por la interfaz de Docker Desktop

Abre la pestaña **Containers** en la barra lateral:

- Vas a ver un grupo llamado **`contacts-app`** (el `name:` del
  `docker-compose.yml`) con tres contenedores adentro: `contacts-db`,
  `contacts-api`, `contacts-web`.
- Click en cualquiera → pestaña **Logs**: la misma salida que verías en la
  terminal, pero filtrada a ese contenedor. Útil para ver solo los logs de
  la API sin el ruido de Postgres.
- Pestaña **Exec**: abre una terminal *dentro* del contenedor.
  - En `contacts-db`: `psql -U contacts -d contacts` te deja correr SQL
    directo (alternativa rápida a DBeaver para una consulta suelta).
  - En `contacts-api`: `sh` te deja mirar los archivos que sí llegaron a la
    imagen (`ls dist`, `cat package.json`) — útil para depurar un Dockerfile.
- **Images** (en la barra lateral): las imágenes que se construyeron
  (`contacts-app-api`, `contacts-app-web`) y las que se descargaron
  (`postgres:16-alpine`, `nginx:1.27-alpine`). Cada `docker compose build`
  reconstruye solo las capas que cambiaron (ver sección 6).
- **Volumes**: ahí vive `contacts-app_pgdata` — los datos reales de
  Postgres. Borrarlo desde la interfaz (o `docker compose down -v`) es
  "empezar de cero".
- La columna **Port(s)** de cada contenedor en la lista principal muestra
  el mapeo `host:contenedor` — confirma que `contacts-web` está en
  `8080→80`, por ejemplo.

## 4. Cómo se conecta todo

```
Tu máquina (host)                          Red interna de Docker "contacts-net"
─────────────────                          ─────────────────────────────────────
Navegador ── localhost:8080 ──►  web (nginx + build de React)
                                   └── /api/* ── http://api:3000 ──►  api (Express)
Postman ──── localhost:3000 ────────────────────────────────────►  api
                                                                     └── db:5432 ──►  db (Postgres)
DBeaver ──── localhost:5432 ────────────────────────────────────────────────────►  db
```

- **Desde el host** (tu máquina), todo se ve por `localhost:<puerto
  publicado>` — porque estos puertos están mapeados en `docker-compose.yml`.
- **Entre contenedores**, nadie usa `localhost` ni una IP: usan el
  **nombre del servicio** (`db`, `api`) como si fuera un hostname —
  Docker resuelve ese nombre por su DNS interno a la IP real (que cambia
  cada vez que se recrea el contenedor, por eso nunca se usa la IP fija).
  Así, `DATABASE_URL` dentro de `api` apunta a `db:5432`, y `nginx.conf`
  dentro de `web` apunta a `http://api:3000`.
- **El navegador nunca habla con `api` directamente en producción**: pasa
  siempre por `web` (nginx), que hace de proxy a `/api/*`. Por eso no hace
  falta configurar CORS para producción — para el navegador, todo viene
  del mismo origen (`localhost:8080`). El puerto `3000` sigue publicado
  igual, para que Postman le hable directo sin pasar por nginx.

## 5. El flujo completo de una request

Ejemplo: el usuario hace clic en "★" para marcar un contacto como favorito.

```
1. React (en el navegador) hace fetch('/api/contacts/<id>', { method: 'PATCH', ... })
2. El navegador resuelve la URL relativa contra localhost:8080 → llega a nginx (contenedor web)
3. nginx ve que empieza con /api/ → location /api/ { proxy_pass http://api:3000; }
4. Dentro de la red de Docker, "api" se resuelve al contenedor contacts-api, puerto 3000
5. Express recibe el PATCH, corre requireAuth → validateBody → el controller → el service
6. El service llama a PgContactRepository, que abre una conexión del Pool hacia "db:5432"
7. Postgres corre el UPDATE, dentro de una transacción, y responde
8. La respuesta viaja de vuelta: Postgres → api → nginx → navegador
```

Cada flecha de esa cadena es una conexión de red real — nada mágico, solo
nombres de servicio resolviéndose dentro de la red de Docker.

## 6. Los Dockerfiles, línea por línea

### `backend/Dockerfile`

```dockerfile
FROM node:22-alpine AS base       # imagen base compartida por las etapas de abajo
WORKDIR /app
RUN corepack enable                # habilita pnpm (viene con Node, pero apagado por defecto)

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile # se instala UNA vez; si solo cambia el código, esta capa queda en caché

FROM deps AS build
COPY src ./src
RUN pnpm build                     # tsc → dist/

FROM base AS runtime                # imagen final: sin las capas de build innecesarias
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY db ./db
COPY scripts ./scripts
COPY src ./src                      # el CLI de migraciones corre con tsx (TS real), no con dist/
USER app                            # nunca corre como root dentro del contenedor
CMD ["sh", "-c", "pnpm exec tsx scripts/db-migrate.ts -- --seed && node dist/server.js"]
```

**Multi-stage**: cada `FROM ... AS <nombre>` es una etapa. Solo el
contenido de la última etapa (`runtime`) termina en la imagen final — las
etapas `deps`/`build` existen solo para producir cosas que la etapa
`runtime` copia con `COPY --from=<etapa>`. Así la imagen final no lleva el
código fuente de compilación, cachés de pnpm, etc.

**Caché de capas**: Docker cachea cada instrucción. Si solo cambias
`src/routes/contacts.routes.ts`, `COPY package.json pnpm-lock.yaml ./` y
`RUN pnpm install` **no se vuelven a ejecutar** (el hash de esos archivos
no cambió) — solo se repiten desde `COPY src ./src` en adelante. Por eso
`package.json`/`pnpm-lock.yaml` se copian *antes* que el resto del código:
maximiza cuánto se reaprovecha del caché.

**Por qué el `runtime` también copia `src/`**: `scripts/db-migrate.ts`
corre con `tsx` (nunca se compila a JS, es un CLI de un solo uso — ver
`docs/11-decisiones-tecnicas.md`) y sus imports apuntan a `../src/...`, así
que el runtime necesita el código fuente además de `dist/`.

### `frontend/Dockerfile`

```dockerfile
FROM node:22-alpine AS build
RUN pnpm install --frozen-lockfile && pnpm build   # genera dist/ (HTML+JS+CSS estáticos)

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html   # nginx sirve estos archivos directamente
COPY nginx.conf /etc/nginx/conf.d/default.conf       # + la config de proxy a /api
```

React compilado es **HTML/CSS/JS estático** — no necesita Node para
*servirse*, solo para *construirse*. Por eso la imagen final ni siquiera
tiene Node instalado: es nginx puro, sirviendo archivos y haciendo de
proxy.

## 7. Esto en un proyecto real

- **Dev vs prod**: en desarrollo real casi nadie reconstruye la imagen de
  Docker en cada cambio — se usa `pnpm dev` local (hot reload) contra un
  Postgres en Docker (`docker compose up -d db`, como en la Opción B del
  README). El `docker compose up --build` completo es más para probar "¿esto
  arranca igual que en producción?" o para un demo rápido.
- **Variables y secretos**: nunca se hardcodea un `JWT_SECRET` real en el
  `Dockerfile` ni en `docker-compose.yml` — viven en `.env` (fuera de git,
  `.gitignore` lo cubre) y Compose los inyecta como variables de entorno.
  En un equipo real, ese `.env` de producción vendría de un gestor de
  secretos (AWS Secrets Manager, Vault, variables de CI/CD), no de un
  archivo en el servidor.
- **Healthchecks**: `db` tiene un `healthcheck` (`pg_isready`) y `api`
  depende de que esté `healthy`, no solo `started` — Postgres tarda unos
  segundos en aceptar conexiones después de "arrancar el proceso"; sin el
  healthcheck, `api` podría intentar conectarse antes de que esté lista.
  `api`/`web` también declaran su propio `HEALTHCHECK` en el Dockerfile —
  así Docker Desktop marca el contenedor como "unhealthy" si dejó de
  responder, no solo "corriendo".
- **`restart: unless-stopped`**: si un contenedor muere (crash, o el host
  se reinicia), Docker lo vuelve a levantar solo — sin esto, un `api` que
  crashea por un bug se queda caído hasta que alguien lo note.
- **Migraciones al arrancar**: el `CMD` del backend corre las migraciones
  (y el seed) **antes** de `node dist/server.js`, en cada arranque — es
  seguro porque ambos pasos son idempotentes (ver `docs/05-postgresql-y-pg.md`).
  En un pipeline de despliegue real, esto a veces se separa en un paso de
  CI/CD distinto ("job de migración") para no acoplar el arranque de la
  app al éxito de la migración, pero para este proyecto mantenerlo simple
  (todo en el mismo `CMD`) es una decisión consciente.
- **Reconstruir tras cambios**: `docker compose up --build` (reconstruye
  solo lo que cambió, por el caché de capas). `docker compose build --no-cache`
  si sospechas que el caché está mintiendo (raro, pero pasa con
  `pnpm-lock.yaml` editado a mano).
- **Ver logs desde la CLI** (sin abrir Docker Desktop):
  `docker compose logs -f api`.

## 8. Troubleshooting

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `port is already allocated` (5432, 3000 u 8080) | Ya tienes algo corriendo en ese puerto (otro Postgres local, otro proyecto) | Detén lo que esté usando ese puerto, o cambia el mapeo en `docker-compose.yml` (`"5433:5432"`, por ejemplo) |
| `api` reinicia en bucle al arrancar todo junto | Intentó conectarse a `db` antes de que aceptara conexiones | No debería pasar (hay `depends_on: condition: service_healthy`) — si pasa, revisa que el `healthcheck` de `db` esté corriendo (`docker compose ps`) |
| `ECONNREFUSED` / "connection refused" en los logs de `api` | `DATABASE_URL` apunta a `localhost` en vez de `db` | Dentro de Docker, el host de Postgres es el nombre del servicio (`db`), nunca `localhost` — `localhost` dentro de un contenedor es *ese mismo contenedor* |
| Cambios en el código no aparecen tras `docker compose up` | Estás editando el código pero no reconstruiste la imagen | `docker compose up --build`, o usa el modo desarrollo (Opción B del README) si vas a iterar seguido |
| `web` (nginx) devuelve 404 en rutas como `/contacts/5` al refrescar | Falta el SPA fallback | Ya está resuelto en `nginx.conf` (`try_files $uri /index.html`) — si lo ves, revisa que no se haya sobrescrito ese archivo |
| Quiero empezar de cero, con datos limpios | El volumen `pgdata` conserva los datos entre reinicios (a propósito) | `docker compose down -v` borra también el volumen — la próxima vez que arranque, siembra los 8 contactos de ejemplo desde cero |
