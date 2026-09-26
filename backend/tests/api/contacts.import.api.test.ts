import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ExternalServiceError } from '../../src/errors/app-error.js';
import { buildTestApp } from '../helpers/build-test-app.js';
import { buildRandomUserSummary, FakeRandomUserClient } from '../helpers/fake-random-user.client.js';

/** Ejercita Promise.allSettled: un contacto que falla no tumba a los demás. */
describe('POST /api/contacts/import', () => {
  it('responde 401 sin token', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).post('/api/contacts/import').send({ count: 3 });
    expect(response.status).toBe(401);
  });

  it('importa contactos desde el servicio externo', async () => {
    const people = [buildRandomUserSummary(), buildRandomUserSummary()];
    const { app, authToken } = await buildTestApp({ randomUserClient: new FakeRandomUserClient(people) });

    const response = await request(app)
      .post('/api/contacts/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ count: 2 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ imported: 2, failed: 0 });
  });

  it('cuenta como "failed" (no revienta la importación) un contacto cuyo email ya existe', async () => {
    const duplicate = buildRandomUserSummary({ email: 'ya-existe@example.com' });
    const { app, authToken } = await buildTestApp({
      randomUserClient: new FakeRandomUserClient([duplicate, buildRandomUserSummary()]),
    });

    await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ first_name: 'Ya', last_name: 'Existe', email: 'ya-existe@example.com' });

    const response = await request(app)
      .post('/api/contacts/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ count: 2 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ imported: 1, failed: 1 });
  });

  it('responde 504 si el servicio externo tardó demasiado', async () => {
    const { app, authToken } = await buildTestApp({
      randomUserClient: new FakeRandomUserClient([], new ExternalServiceError('timeout', 504)),
    });

    const response = await request(app)
      .post('/api/contacts/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ count: 1 });

    expect(response.status).toBe(504);
  });

  it('responde 422 si count está fuera de rango', async () => {
    const { app, authToken } = await buildTestApp();
    const response = await request(app)
      .post('/api/contacts/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ count: 100 });
    expect(response.status).toBe(422);
  });
});
