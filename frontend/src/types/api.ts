/** Forma de cualquier error que devuelve la API (400/401/404/409/422/500). */
export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}

/** `{ "phones.0.number": ["Debe tener 10 dígitos."] }` — igual que `errors` en la respuesta 422. */
export type FieldErrors = Record<string, string[]>;
