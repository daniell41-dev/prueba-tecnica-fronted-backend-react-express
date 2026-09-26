import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, ApiError, clearStoredToken, getStoredToken, setStoredToken } from '../../src/api/http.js';

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body } as unknown as Response;
}

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearStoredToken();
  });

  it('manda Authorization cuando hay un token guardado', async () => {
    setStoredToken('abc123');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/contacts');

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Headers).get('Authorization')).toBe('Bearer abc123');
  });

  it('no manda Authorization sin token guardado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/contacts');

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Headers).has('Authorization')).toBe(false);
  });

  it('devuelve null para un 204 sin cuerpo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { status: 204 })));
    const result = await apiFetch('/contacts/1', { method: 'DELETE' });
    expect(result).toBeNull();
  });

  it('lanza ApiError con status y fieldErrors en un 422', async () => {
    const body = { message: 'Los datos enviados no son válidos.', errors: { email: ['Debe ser un correo electrónico válido.'] } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(body, { ok: false, status: 422 })));

    await expect(apiFetch('/contacts', { method: 'POST' })).rejects.toMatchObject({
      status: 422,
      fieldErrors: { email: ['Debe ser un correo electrónico válido.'] },
    });
  });

  it('el error lanzado es instancia de ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'no autenticado' }, { ok: false, status: 401 })));
    await expect(apiFetch('/auth/me')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('token en localStorage', () => {
  afterEach(() => clearStoredToken());

  it('guarda, lee y borra el token', () => {
    expect(getStoredToken()).toBeNull();
    setStoredToken('xyz');
    expect(getStoredToken()).toBe('xyz');
    clearStoredToken();
    expect(getStoredToken()).toBeNull();
  });
});
