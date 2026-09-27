import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../helpers/build-test-app.js';

const MISSING_ID = '6f9619ff-8b86-d011-b42d-00cf4fc964ff';

describe('DELETE /api/contacts/:id', () => {
  it('responde 401 sin token', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).delete(`/api/contacts/${MISSING_ID}`);
    expect(response.status).toBe(401);
  });

  it('borra el contacto y responde 204 sin cuerpo', async () => {
    const { app, authToken } = await buildTestApp();
    const created = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' });

    const response = await request(app)
      .delete(`/api/contacts/${created.body.contact.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});

    const afterDelete = await request(app).get(`/api/contacts/${created.body.contact.id}`);
    expect(afterDelete.status).toBe(404);
  });

  it('responde 404 si el contacto no existe', async () => {
    const { app, authToken } = await buildTestApp();
    const response = await request(app).delete(`/api/contacts/${MISSING_ID}`).set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(404);
  });
});
