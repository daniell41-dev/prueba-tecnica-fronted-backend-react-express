import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../helpers/build-test-app.js';

const validPayload = {
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engine',
  favorite: true,
  phones: [
    { type: 'mobile', number: '+52 55 1111 2222' },
    { type: 'work', number: '5533334444' },
  ],
};

describe('POST /api/contacts', () => {
  it('responde 401 sin token', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).post('/api/contacts').send(validPayload);
    expect(response.status).toBe(401);
  });

  it('crea el contacto y responde 201 con Location', async () => {
    const { app, authToken } = await buildTestApp();

    const response = await request(app).post('/api/contacts').set('Authorization', `Bearer ${authToken}`).send(validPayload);

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(`/api/contacts/${response.body.contact.id}`);
    expect(response.body.contact.phones[0].number).toBe('5511112222');
  });

  it('responde 422 si first_name/last_name/email vienen vacíos', async () => {
    const { app, authToken } = await buildTestApp();

    const response = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ first_name: '', last_name: '', email: '' });

    expect(response.status).toBe(422);
    expect(response.body.errors).toHaveProperty('first_name');
    expect(response.body.errors).toHaveProperty('last_name');
    expect(response.body.errors).toHaveProperty('email');
  });

  it('responde 422 con un teléfono inválido', async () => {
    const { app, authToken } = await buildTestApp();

    const response = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ...validPayload, phones: [{ number: '55-ABCD' }] });

    expect(response.status).toBe(422);
    expect(response.body.errors).toHaveProperty('phones.0.number');
  });

  it('responde 409 si el email ya está registrado', async () => {
    const { app, authToken } = await buildTestApp();
    await request(app).post('/api/contacts').set('Authorization', `Bearer ${authToken}`).send(validPayload);

    const response = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ...validPayload, first_name: 'Otra' });

    expect(response.status).toBe(409);
  });

  it('responde 400 si el body no es JSON válido', async () => {
    const { app, authToken } = await buildTestApp();

    const response = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json')
      .send('{ esto no es json');

    expect(response.status).toBe(400);
  });
});
