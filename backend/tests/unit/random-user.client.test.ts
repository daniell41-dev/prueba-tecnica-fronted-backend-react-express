import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpRandomUserClient } from '../../src/clients/random-user.client.js';
import { ExternalServiceError } from '../../src/errors/app-error.js';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

const validPayload = {
  results: [
    {
      name: { first: 'Ada', last: 'Lovelace' },
      email: 'ada@example.com',
      phone: '55 1234 5678',
      location: { state: 'CDMX' },
    },
  ],
};

/**
 * Cubre el objetivo de práctica "async/await, Promise.all/allSettled y
 * manejo de errores en llamadas externas": timeout, reintento y payload
 * inválido, todo con `vi.stubGlobal('fetch', ...)` — sin tocar la red real.
 */
describe('HttpRandomUserClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mapea el payload de randomuser.me a RandomUserSummary', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(validPayload)));

    const people = await new HttpRandomUserClient().fetchRandomPeople(1);

    expect(people).toEqual([
      { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', phone: '55 1234 5678', company: 'CDMX' },
    ]);
  });

  it('reintenta una vez si la primera llamada falla por red, y funciona si la segunda responde bien', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('network down')).mockResolvedValueOnce(jsonResponse(validPayload));
    vi.stubGlobal('fetch', fetchMock);

    const people = await new HttpRandomUserClient().fetchRandomPeople(1);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(people).toHaveLength(1);
  });

  it('lanza ExternalServiceError 502 tras dos fallos de red seguidos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));

    await expect(new HttpRandomUserClient().fetchRandomPeople(1)).rejects.toMatchObject({ statusCode: 502 });
  });

  it('lanza ExternalServiceError 504 cuando la llamada expira por timeout', async () => {
    const timeoutError = new DOMException('The operation timed out.', 'TimeoutError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeoutError));

    await expect(new HttpRandomUserClient().fetchRandomPeople(1)).rejects.toMatchObject({ statusCode: 504 });
  });

  it('lanza ExternalServiceError 502 tras dos respuestas no-2xx seguidas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false, 500)));

    await expect(new HttpRandomUserClient().fetchRandomPeople(1)).rejects.toMatchObject({ statusCode: 502 });
  });

  it('lanza ExternalServiceError 502 si el payload no tiene la forma esperada, sin reintentar (no es transitorio)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ oops: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new HttpRandomUserClient().fetchRandomPeople(1)).rejects.toBeInstanceOf(ExternalServiceError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
