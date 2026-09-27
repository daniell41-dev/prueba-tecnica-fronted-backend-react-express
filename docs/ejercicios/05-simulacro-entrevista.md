# Kata 5 — Simulacro de entrevista (60-90 min)

Las cuatro katas anteriores, encadenadas, con reloj, simulando la
estructura real de una entrevista de live coding. Hazlo al menos una vez
completo antes de la entrevista de verdad — la primera vez que encadenas
las cuatro cosas bajo presión de tiempo **debe** ser una práctica, no la
entrevista misma.

## Guion (cronometrado)

| Tiempo | Qué |
|---|---|
| 0:00 – 0:10 | **Recorrido de la estructura** (kata 1) — nárralo en voz alta, aunque estés solo. Grábate si puedes; escúchate después. |
| 0:10 – 0:45 | **Endpoint con paginación y filtro** (kata 2) — aplica `quitar-paginacion.patch` y reconstrúyelo |
| 0:45 – 1:15 | **Middleware JWT** (kata 3) — aplica `quitar-jwt.patch` y reconstrúyelo |
| 1:15 – 1:30 | **Un bug al azar** (kata 4) — pide a alguien (o usa un dado/`shuf`) que elija uno de los tres `bugs/*.patch` sin que sepas cuál; repite el ciclo reproducir → test → fix |

Si te quedas sin tiempo en algún bloque, **sigue al siguiente igual** —
parte del entrenamiento es practicar qué hacer cuando no terminaste algo
(decir en voz alta "esto me quedó a medias, esto es lo que me faltaba y
por qué" es una señal de madurez, no de fracaso).

## Antes de empezar

```bash
docker compose up -d db
pnpm --dir backend db:migrate -- --fresh --seed
pnpm --dir backend dev &   # o en otra terminal
```

## Rúbrica de autoevaluación

Después del simulacro, califícate honestamente en cada uno (1-5):

- [ ] **Comunicación**: ¿narraste tu plan antes de teclear? ¿preguntaste
      cuando algo no estaba claro (aunque fuera a ti mismo, en voz alta)?
- [ ] **Pasos pequeños**: ¿corriste algo (typecheck/test/curl) cada pocos
      minutos, o escribiste todo de un golpe y probaste al final?
- [ ] **Manejo del error**: cuando algo falló, ¿leíste el mensaje de error
      completo antes de cambiar código a ciegas?
- [ ] **Bajo presión de tiempo**: ¿mantuviste el código limpio (nombres
      claros, sin código muerto) o empezaste a "ensuciar" apenas viste que
      se acababa el tiempo?
- [ ] **Tests**: ¿el test que escribiste para el bug realmente fallaba
      *antes* del fix?

## Preguntas teóricas para el cierre (que alguien te haga, o que te
respondas tú mismo en voz alta)

1. ¿Por qué `Promise.all` en la paginación y no dos `await` seguidos?
2. ¿Qué pasa si dos requests intentan crear un contacto con el mismo email
   exactamente al mismo tiempo? (pista: `docs/05-postgresql-y-pg.md`, el
   error `23505`)
3. ¿Por qué el middleware de errores tiene 4 parámetros?
4. ¿Cómo evitarías una inyección SQL en un `ORDER BY` dinámico si no
   puedes parametrizarlo?
5. ¿Qué diferencia práctica hay entre `jwt.verify` y `jwt.decode`?

Si alguna te cuesta responder sin pensar, es la señal de qué releer antes
de la entrevista real — vuelve al doc correspondiente en `docs/`, no
memorices la respuesta suelta.

## Repite

Una vez no es suficiente. Repite este simulacro cada 2-3 días hasta que el
tiempo total te sobre, no te falte — ese margen extra es justo lo que
necesitas para pensar con calma cuando la entrevista real te ponga un
problema que no sea exactamente este.
