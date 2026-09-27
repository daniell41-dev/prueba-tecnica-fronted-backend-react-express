import { z } from 'zod';
import { env } from '../config/env.js';
import { ExternalServiceError } from '../errors/app-error.js';

/**
 * Cliente para randomuser.me, usado por `POST /api/contacts/import` para
 * practicar llamadas externas: `fetch` + `AbortSignal.timeout` + un
 * reintento + validación del payload con Zod, todo mapeado a 502/504 en vez
 * de dejar que un error de red se filtre como `500` (ver
 * `docs/03-fundamentos-node-express.md`).
 */
const randomUserResponseSchema = z.object({
  results: z.array(
    z.object({
      name: z.object({ first: z.string(), last: z.string() }),
      email: z.string().email(),
      phone: z.string(),
      location: z.object({ state: z.string().optional() }).optional(),
    }),
  ),
});

export interface RandomUserSummary {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string | null;
}

/**
 * `ContactImportService` depende de esta interfaz, no de `HttpRandomUserClient`
 * directamente — así los tests inyectan un `FakeRandomUserClient`
 * (`tests/helpers/`) sin golpear la red ni depender de que randomuser.me esté
 * arriba.
 */
export interface RandomUserClient {
  fetchRandomPeople(count: number): Promise<RandomUserSummary[]>;
}

function toSummary(person: z.infer<typeof randomUserResponseSchema>['results'][number]): RandomUserSummary {
  return {
    firstName: person.name.first,
    lastName: person.name.last,
    email: person.email,
    phone: person.phone,
    company: person.location?.state ?? null,
  };
}

export class HttpRandomUserClient implements RandomUserClient {
  async fetchRandomPeople(count: number): Promise<RandomUserSummary[]> {
    return this.attemptFetch(count, 0);
  }

  private async attemptFetch(count: number, attempt: number): Promise<RandomUserSummary[]> {
    const url = `${env.RANDOM_USER_API_URL}?results=${count}&nat=mx`;

    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(env.RANDOM_USER_TIMEOUT_MS) });
    } catch (error) {
      if (attempt < 1) {
        return this.attemptFetch(count, attempt + 1);
      }
      throw this.toExternalError(error);
    }

    if (!response.ok) {
      if (attempt < 1) {
        return this.attemptFetch(count, attempt + 1);
      }
      throw new ExternalServiceError(`El servicio externo respondió con estado ${response.status}.`, 502);
    }

    return this.parsePeople(await response.json());
  }

  /** Un payload con forma inesperada no es transitorio: no vale la pena reintentar. */
  private parsePeople(payload: unknown): RandomUserSummary[] {
    try {
      const parsed = randomUserResponseSchema.parse(payload);
      return parsed.results.map(toSummary);
    } catch {
      throw new ExternalServiceError('El servicio externo devolvió un formato inesperado.', 502);
    }
  }

  private toExternalError(error: unknown): ExternalServiceError {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return new ExternalServiceError('El servicio externo tardó demasiado en responder.', 504);
    }
    return new ExternalServiceError('No se pudo contactar al servicio externo.', 502);
  }
}
