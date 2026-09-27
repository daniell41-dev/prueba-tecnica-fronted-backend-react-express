import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import type { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { createContainer } from '../../src/container.js';
import { applyMigrations, createTestPool, truncateAll } from './helpers/db.js';

/**
 * Smoke test: la app completa (Kernel → rutas → controllers → services →
 * `PgContactRepository`) contra un Postgres real, de punta a punta con
 * Supertest. No repite los 400/401/404/422 (eso ya está cubierto en
 * `tests/api/` con repos en memoria) — solo confirma que el cableado real
 * (container → pool → SQL) funciona.
 */
describe('app end-to-end contra Postgres real (smoke test)', () => {
  let pool: Pool;
  let app: Express;

  beforeAll(async () => {
    pool = createTestPool();
    await applyMigrations(pool);
    app = createApp(createContainer(pool));
  });

  beforeEach(async () => {
    await truncateAll(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('GET /api/health consulta la base real', async () => {
    const response = await request(app).get('/api/health');
    expect(response.body).toEqual({ status: 'ok', db: 'up' });
  });

  it('crea, lista, obtiene y borra un contacto de punta a punta', async () => {
    const authToken = jwt.sign({ sub: 'smoke-test-user', email: 'smoke@example.com' }, env.JWT_SECRET);

    const created = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada@example.com',
        phones: [{ type: 'mobile', number: '+52 55 1111 2222' }],
      });
    expect(created.status).toBe(201);

    const list = await request(app).get('/api/contacts');
    expect(list.body.contacts).toHaveLength(1);
    expect(list.body.contacts[0].phones[0].number).toBe('5511112222');

    const show = await request(app).get(`/api/contacts/${created.body.contact.id}`);
    expect(show.status).toBe(200);

    const destroyed = await request(app).delete(`/api/contacts/${created.body.contact.id}`).set('Authorization', `Bearer ${authToken}`);
    expect(destroyed.status).toBe(204);

    const afterDelete = await request(app).get(`/api/contacts/${created.body.contact.id}`);
    expect(afterDelete.status).toBe(404);
  });
});
