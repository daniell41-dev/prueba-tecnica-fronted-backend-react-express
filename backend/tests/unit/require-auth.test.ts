import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';
import { env } from '../../src/config/env.js';
import { UnauthorizedError } from '../../src/errors/app-error.js';
import { requireAuth } from '../../src/middlewares/require-auth.js';

function buildRequest(authorizationHeader?: string): Request {
  return { headers: { authorization: authorizationHeader } } as unknown as Request;
}

describe('requireAuth', () => {
  it('con un token válido, rellena req.user y llama next() sin argumentos', () => {
    const token = jwt.sign({ sub: 'user-1', email: 'demo@example.com' }, env.JWT_SECRET);
    const req = buildRequest(`Bearer ${token}`);
    const next = vi.fn();

    requireAuth(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: 'user-1', email: 'demo@example.com' });
  });

  it('sin header Authorization, llama next(UnauthorizedError)', () => {
    const next = vi.fn();
    requireAuth(buildRequest(undefined), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('con un header que no empieza con "Bearer ", llama next(UnauthorizedError)', () => {
    const next = vi.fn();
    requireAuth(buildRequest('Token abc123'), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('con un token que no es un JWT válido, llama next(UnauthorizedError)', () => {
    const next = vi.fn();
    requireAuth(buildRequest('Bearer no-es-un-jwt'), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('con un token expirado, llama next(UnauthorizedError) — usa jwt.verify, nunca jwt.decode', () => {
    const expiredToken = jwt.sign({ sub: 'user-1', email: 'demo@example.com' }, env.JWT_SECRET, { expiresIn: -10 });
    const next = vi.fn();

    requireAuth(buildRequest(`Bearer ${expiredToken}`), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('con un token firmado con otro secreto, llama next(UnauthorizedError)', () => {
    const token = jwt.sign({ sub: 'user-1', email: 'demo@example.com' }, 'otro-secreto-cualquiera-de-32-caracteres+');
    const next = vi.fn();

    requireAuth(buildRequest(`Bearer ${token}`), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});
