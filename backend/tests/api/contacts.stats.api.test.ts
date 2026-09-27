import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../helpers/build-test-app.js';

describe('GET /api/contacts/stats', () => {
  it('agrega total, favoritos y top empresas (tres queries en paralelo con Promise.all)', async () => {
    const { app, authToken } = await buildTestApp();
    await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', favorite: true, company: 'Acme' });
    await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ first_name: 'Grace', last_name: 'Hopper', email: 'grace@example.com', favorite: false, company: 'Acme' });

    const response = await request(app).get('/api/contacts/stats');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.favorites).toBe(1);
    expect(response.body.top_companies[0]).toEqual({ company: 'Acme', count: 2 });
  });
});
