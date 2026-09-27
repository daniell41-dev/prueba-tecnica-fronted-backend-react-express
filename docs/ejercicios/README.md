# Katas de práctica para la entrevista de live coding

Cinco ejercicios, pensados para hacerse **en orden** y **con reloj**. El
objetivo no es que memorices este código — es que lo rehagas tantas veces
que, en la entrevista real, tus manos ya sepan el camino aunque los nervios
te tengan la cabeza a mil.

| # | Kata | Qué practica | Tiempo sugerido |
|---|---|---|---|
| 1 | [Entender la estructura en 10 min](01-entender-la-estructura-en-10-min.md) | Orientarte rápido en un repo que no escribiste | 10 min |
| 2 | [Endpoint con paginación y filtro](02-endpoint-paginacion-y-filtro.md) | Zod + service con `Promise.all` + controller + test | 30-40 min |
| 3 | [Middleware JWT](03-middleware-jwt.md) | Autenticación, middlewares de Express, module augmentation | 25-35 min |
| 4 | [Corregir un bug y escribir su test](04-corregir-bug-y-test.md) | El flujo real de "me reportan un bug" | 15-20 min por bug |
| 5 | [Simulacro de entrevista](05-simulacro-entrevista.md) | Las cuatro anteriores, de punta a punta, con reloj | 60-90 min |

## Cómo practicar sin ensuciar tu rama de trabajo

Crea una rama descartable para cada intento:

```bash
git checkout -b practica/paginacion
git apply docs/ejercicios/practica/quitar-paginacion.patch   # borra la funcionalidad
# ... la reconstruyes tú, siguiendo la kata 2 ...
pnpm --dir backend test                                       # hasta que vuelva a estar en verde
git checkout main -- .                                        # o simplemente borra la rama al terminar
git branch -D practica/paginacion
```

- **`docs/ejercicios/practica/`** — parches que **quitan** una
  funcionalidad completa (paginación, JWT) dejando los tests que la cubren
  intactos. Los tests van a fallar apenas apliques el parche — tu trabajo
  es reconstruir la funcionalidad hasta que vuelvan a pasar.
- **`docs/ejercicios/bugs/`** — parches que **meten** un bug real (uno de
  los que de verdad se cuelan en código así) y **quitan el test que lo
  atraparía** — así la suite sigue en verde después de aplicar el parche,
  igual que pasaría si ese bug llegara a producción sin que nadie lo note.
  Tu trabajo (kata 4): reproducirlo, escribir el test que lo atrapa, y
  arreglarlo.

Para deshacer cualquier parche sin usar git: `git apply -R <archivo.patch>`.

## Antes de empezar cualquier kata

```bash
docker compose up -d db
pnpm --dir backend db:migrate -- --fresh --seed
pnpm --dir backend dev     # deja esto corriendo en otra terminal
```
