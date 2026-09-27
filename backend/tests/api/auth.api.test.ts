import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp, TEST_USER_EMAIL, TEST_USER_PASSWORD } from '../helpers/build-test-app.js';

describe('POST /api/auth/login', () => {
  it('devuelve un token con credenciales correctas', async () => {
    const { app } = await buildTestApp();

    const response = await request(app).post('/api/auth/login').send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe('string');
    expect(response.body.user).toMatchObject({ email: TEST_USER_EMAIL });
  });

  it('responde 401 con contraseña incorrecta', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).post('/api/auth/login').send({ email: TEST_USER_EMAIL, password: 'incorrecta' });
    expect(response.status).toBe(401);
  });

  it('responde 401 con un email que no existe (mismo mensaje que contraseña incorrecta)', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).post('/api/auth/login').send({ email: 'no-existe@example.com', password: 'lo-que-sea' });
    expect(response.status).toBe(401);
  });

  it('responde 422 si falta el email', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).post('/api/auth/login').send({ password: TEST_USER_PASSWORD });
    expect(response.status).toBe(422);
  });
});

describe('GET /api/auth/me', () => {
  it('responde 401 sin token', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });

  it('responde 200 con el usuario autenticado', async () => {
    const { app, authToken } = await buildTestApp();
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(TEST_USER_EMAIL);
  });
});
