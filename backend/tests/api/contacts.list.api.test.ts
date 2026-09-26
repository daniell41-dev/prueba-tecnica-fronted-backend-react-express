import type { Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../helpers/build-test-app.js';

function createContact(app: Express, authToken: string, overrides: Record<string, unknown> = {}) {
  return request(app)
    .post('/api/contacts')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      first_name: 'Nombre',
      last_name: 'Apellido',
      email: `contacto-${Math.random().toString(36).slice(2)}@example.com`,
      ...overrides,
    });
}

/** Kata 2: paginación y filtro (ver docs/ejercicios/02-endpoint-paginacion-y-filtro.md). */
describe('GET /api/contacts', () => {
  it('lista vacía con meta en 0', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).get('/api/contacts');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ contacts: [], meta: { page: 1, limit: 10, total: 0, total_pages: 1 } });
  });

  it('pagina con page/limit', async () => {
    const { app, authToken } = await buildTestApp();
    for (let index = 0; index < 15; index += 1) {
      await createContact(app, authToken);
    }

    const firstPage = await request(app).get('/api/contacts').query({ page: 1, limit: 10 });
    const secondPage = await request(app).get('/api/contacts').query({ page: 2, limit: 10 });

    expect(firstPage.body.contacts).toHaveLength(10);
    expect(secondPage.body.contacts).toHaveLength(5);
    expect(firstPage.body.meta).toEqual({ page: 1, limit: 10, total: 15, total_pages: 2 });
  });

  it('filtra por favorite', async () => {
    const { app, authToken } = await buildTestApp();
    await createContact(app, authToken, { favorite: true });
    await createContact(app, authToken, { favorite: false });

    const response = await request(app).get('/api/contacts').query({ favorite: 'true' });

    expect(response.body.contacts).toHaveLength(1);
    expect(response.body.contacts[0].favorite).toBe(true);
  });

  it('filtra por texto libre (search) sobre nombre/apellido/email/empresa', async () => {
    const { app, authToken } = await buildTestApp();
    await createContact(app, authToken, { first_name: 'Grace', last_name: 'Hopper', company: 'US Navy' });
    await createContact(app, authToken, { first_name: 'Ada', last_name: 'Lovelace', company: 'Analytical Engine' });

    const response = await request(app).get('/api/contacts').query({ search: 'navy' });

    expect(response.body.contacts).toHaveLength(1);
    expect(response.body.contacts[0].last_name).toBe('Hopper');
  });

  it('ordena por sort/order', async () => {
    const { app, authToken } = await buildTestApp();
    await createContact(app, authToken, { first_name: 'Beto' });
    await createContact(app, authToken, { first_name: 'Ana' });

    const response = await request(app).get('/api/contacts').query({ sort: 'first_name', order: 'desc' });

    expect(response.body.contacts.map((contact: { first_name: string }) => contact.first_name)).toEqual(['Beto', 'Ana']);
  });

  it('responde 422 con un limit fuera de rango', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).get('/api/contacts').query({ limit: 999 });
    expect(response.status).toBe(422);
  });
});
