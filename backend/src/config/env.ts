import { z } from 'zod';

/**
 * Toda la configuración de la app pasa por aquí. Se valida `process.env` una
 * sola vez, al arrancar (`server.ts` importa este módulo antes que nada) —
 * "fail fast": si falta o está mal una variable, el proceso no arranca en
 * silencio con un `undefined` que explota tres capas más abajo.
 *
 * Equivalente Node de `App\Support\Config` en la versión PHP de ATL, pero
 * tipado y validado con Zod en vez de leer `getenv()` a mano.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria.'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres.'),
  JWT_EXPIRES_IN: z.string().default('1h'),

  CORS_ALLOWED_ORIGIN: z.string().default('*'),

  RANDOM_USER_API_URL: z.string().url().default('https://randomuser.me/api/'),
  RANDOM_USER_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),

  APP_DEBUG: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('✗ Configuración inválida (variables de entorno):');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
export type Env = typeof env;
