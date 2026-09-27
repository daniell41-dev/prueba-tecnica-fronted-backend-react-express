import type { Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../helpers/build-test-app.js';

const MISSING_ID = '6f9619ff-8b86-d011-b42d-00cf4fc964ff';

async function createContact(app: Express, authToken: string) {
  const response = await request(app)
    .post('/api/contacts')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
      favorite: true,
      phones: [{ type: 'mobile', number: '5511112222' }],
    });
  return response.body.contact;
}

describe('PUT /api/contacts/:id', () => {
  it('responde 401 sin token', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).put(`/api/contacts/${MISSING_ID}`).send({});
    expect(response.status).toBe(401);
  });

  it('reemplaza el contacto por completo, incluidos los teléfonos', async () => {
    const { app, authToken } = await buildTestApp();
    const contact = await createContact(app, authToken);

    const response = await request(app)
      .put(`/api/contacts/${contact.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', phones: [{ type: 'work', number: '5533334444' }] });

    expect(response.status).toBe(200);
    expect(response.body.contact.phones).toHaveLength(1);
    expect(response.body.contact.phones[0].number).toBe('5533334444');
  });

  it('responde 404 si el contacto no existe', async () => {
    const { app, authToken } = await buildTestApp();
    const response = await request(app)
      .put(`/api/contacts/${MISSING_ID}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' });
    expect(response.status).toBe(404);
  });
});

/** Kata 4: `favorite: false` en un PATCH — el bug clásico de `||` en vez de `??`. */
describe('PATCH /api/contacts/:id', () => {
  it('actualiza solo el campo enviado; favorite=false no se pierde', async () => {
    const { app, authToken } = await buildTestApp();
    const contact = await createContact(app, authToken);

    const response = await request(app)
      .patch(`/api/contacts/${contact.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ favorite: false });

    expect(response.status).toBe(200);
    expect(response.body.contact.favorite).toBe(false);
    expect(response.body.contact.first_name).toBe('Ada');
  });

  it('responde 404 si el contacto no existe', async () => {
    const { app, authToken } = await buildTestApp();
    const response = await request(app)
      .patch(`/api/contacts/${MISSING_ID}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ favorite: true });
    expect(response.status).toBe(404);
  });
});
