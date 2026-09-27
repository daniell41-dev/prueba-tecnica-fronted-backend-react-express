import type { RandomUserClient, RandomUserSummary } from '../../src/clients/random-user.client.js';
import type { ExternalServiceError } from '../../src/errors/app-error.js';

/**
 * Doble de prueba para `RandomUserClient`. Por defecto devuelve `people`
 * (o una lista generada); `throwError` simula que el servicio externo falló,
 * para probar el mapeo a 502/504 sin hacer una llamada de red real.
 */
export class FakeRandomUserClient implements RandomUserClient {
  constructor(
    private readonly people: RandomUserSummary[] = [],
    private readonly throwError?: ExternalServiceError,
  ) {}

  async fetchRandomPeople(count: number): Promise<RandomUserSummary[]> {
    if (this.throwError) {
      throw this.throwError;
    }
    return this.people.slice(0, count);
  }
}

export function buildRandomUserSummary(overrides: Partial<RandomUserSummary> = {}): RandomUserSummary {
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    firstName: 'Random',
    lastName: 'User',
    email: `random.${suffix}@example.com`,
    phone: '55 1234 5678',
    company: null,
    ...overrides,
  };
}
