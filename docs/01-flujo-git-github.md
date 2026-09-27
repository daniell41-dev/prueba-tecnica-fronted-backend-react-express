# 01 - FLUJO GIT Y GITHUB

## 📖 Guía completa del workflow de Git Flow

Este documento explica el flujo de trabajo con Git y GitHub para este
proyecto. Adaptado del mismo esquema usado en `prueba-tecnica-backend-atl` y
`prueba-tecnica-fronted-atl`, para que los tres repos hablen el mismo idioma
de Git.

---

## 🌳 Estructura de ramas

```
main (producción / entrega final - protegida)
  ↑
  │ (PR al final de cada fase)
  │
develop (integración - default)
  ↑
  │ (PRs de cada tarea)
  │
feature/<descripción> (tareas individuales)
```

- **`main`** — solo código estable y probado; protegida, solo acepta PRs de `develop`.
- **`develop`** — integración de todas las tareas; rama por defecto del repositorio; base
  para crear ramas `feature/*`; siempre debe estar funcional (`pnpm lint && pnpm test` en
  verde, backend y frontend).
- **`feature/<descripción>`** — una rama por tarea; se crea desde `develop`; se fusiona de
  vuelta vía PR; se elimina después del merge.

---

## ☁️ Adaptación a Claude Code on the web

Este repositorio se desarrolla con **Claude Code on the web**, donde cada sesión trabaja
sobre una **rama de sesión asignada** (p. ej. `claude/kind-maxwell-*`) y, por
seguridad, **solo puede hacer push a esa rama**. Por eso la convención práctica es:

| Quién | Hace |
|-------|------|
| **Claude (sesión web)** | Desarrolla la tarea completa en su **rama de sesión**: crea el issue, commitea con Conventional Commits, abre el PR rama→`develop` y lo mergea. Llega solo hasta `develop`. |
| **Tú (mantenedor)** | Revisas `develop`, y cuando quieras llevar el trabajo a `main` (entrega final), lo pides explícitamente — Claude abre ese PR y espera tu aprobación para mergearlo. |

> **Regla clave:** el único paso que requiere pedirlo explícitamente es el PR
> `develop → main`. Todo lo anterior (issue → commits → PR → merge a `develop`) ocurre
> sin que haga falta pedirlo cada vez.

---

## 🔄 Flujo de trabajo por tarea

```
1. Crear issue describiendo la tarea
2. Desarrollar en la rama de sesión, commiteando por capa/pieza lógica
3. pnpm lint && pnpm test (backend y frontend) antes de dar por cerrada la tarea
4. Push a la rama de sesión
5. Crear PR rama de sesión → develop (Closes #N)
6. Merge del PR a develop, cerrar issue
7. Avisar que develop está listo; PR develop → main solo si se pide explícitamente
```

---

## 📝 Convenciones de commits

**Conventional Commits:**

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
refactor: refactorización sin cambio de comportamiento
test: agregar o modificar tests
chore: tareas de mantenimiento (tooling, dependencias)
ci: cambios en integración continua
build: cambios en Dockerfiles / build de producción

Ejemplos (contexto de este repo):
feat: add express app with health check and error handling
feat: add pagination and filters to contacts list
feat: add jwt authentication
fix: keep favorite=false from being reset to the previous value
test: add integration tests for pg contact repository
docs: add study guides and live-coding katas
build: add dockerfiles and docker compose
```

---

## 🛠️ Comandos de referencia rápida

### Git básico

```bash
git status
git branch -a
git checkout -b feature/nombre-descriptivo
git log --oneline --graph --all
git fetch origin
git pull origin develop
```

### pnpm (backend y frontend son dos paquetes independientes)

```bash
pnpm --dir backend install
pnpm --dir backend lint && pnpm --dir backend typecheck && pnpm --dir backend test
pnpm --dir backend db:migrate -- --fresh --seed

pnpm --dir frontend install
pnpm --dir frontend lint && pnpm --dir frontend test && pnpm --dir frontend build

docker compose up --build      # todo el stack
```

---

## ✅ Buenas prácticas

**Hacer:**
- Commits frecuentes y descriptivos, uno por capa/pieza lógica cuando tenga sentido.
- `pnpm lint && pnpm test` (backend y frontend) antes de cada push.
- Mantener `develop` siempre funcional.
- Cerrar issues al completar tareas (`Closes #N` en el PR).
- Seguir las convenciones de código de `CLAUDE.md` (300 líneas por archivo,
  pages que solo renderizan, etc.) — el lint las hace cumplir.

**Evitar:**
- Commits gigantes que mezclan varias capas sin relación.
- Pushear con `pnpm lint` o `pnpm test` en rojo.
- Tocar `main` directamente.
