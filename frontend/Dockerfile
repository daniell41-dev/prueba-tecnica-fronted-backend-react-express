# syntax=docker/dockerfile:1
#
# Build de producción con Node, servido por nginx — nginx hace de proxy a
# `/api` (ver nginx.conf), así el navegador nunca ve el contenedor `api`
# directamente y no hace falta configurar CORS en producción.

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://localhost:80/ >/dev/null || exit 1
