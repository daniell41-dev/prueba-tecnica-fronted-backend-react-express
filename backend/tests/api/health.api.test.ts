import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../helpers/build-test-app.js';

describe('GET /api/health', () => {
  it('responde 200 cuando la base está arriba', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', db: 'up' });
  });
});

describe('rutas que no existen', () => {
  it('responde 404 con un mensaje genérico', async () => {
    const { app } = await buildTestApp();
    const response = await request(app).get('/api/no-existe');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'La ruta solicitada no existe.' });
  });
});
