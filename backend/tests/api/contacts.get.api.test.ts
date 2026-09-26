import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../helpers/build-test-app.js';

describe('GET /api/contacts/:id', () => {
  it('responde 200 con el contacto', async () => {
    const { app, authToken } = await buildTestApp();
    const created = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' });

    const response = await request(app).get(`/api/contacts/${created.body.contact.id}`);

    expect(response.status).toBe(200);
    expect(response.body.contact.email).toBe('ada@example.com');
  });

  it('responde 404 si el id no existe (pero tiene forma de UUID)', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).get('/api/contacts/6f9619ff-8b86-d011-b42d-00cf4fc964ff');
    expect(response.status).toBe(404);
  });

  it('responde 404, no 500, si el id no tiene forma de UUID', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).get('/api/contacts/no-es-un-uuid');
    expect(response.status).toBe(404);
  });
});
