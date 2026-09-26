import { ApiError } from '../api/http.js';

/** Mensaje listo para mostrar en un banner de error — no expone detalles internos. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}
