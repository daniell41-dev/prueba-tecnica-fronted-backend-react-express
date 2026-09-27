import type { ApiErrorBody, FieldErrors } from '../types/api.js';

const TOKEN_STORAGE_KEY = 'contacts-app.token';

/**
 * Se lanza para cualquier respuesta no-2xx. `fieldErrors` solo viene lleno en
 * un 422 — los formularios lo usan para pintar el mensaje bajo cada campo.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'message' in value;
}

/**
 * Wrapper de `fetch` para toda la app: agrega `Authorization: Bearer` si hay
 * token, siempre manda/espera JSON, y convierte cualquier respuesta no-2xx
 * en un `ApiError` con el `status` y (si aplica) los `fieldErrors` del 422 —
 * así los componentes nunca leen `response.ok` a mano.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api${path}`, { ...options, headers });
  const body = await parseBody(response);

  if (!response.ok) {
    const errorBody = isApiErrorBody(body) ? body : { message: `Error ${response.status}` };
    throw new ApiError(response.status, errorBody.message, errorBody.errors);
  }

  return body as T;
}
