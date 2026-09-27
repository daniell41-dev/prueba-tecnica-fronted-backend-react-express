import type { FieldErrors } from '../types/api.js';

/** El primer mensaje para un campo (o de un teléfono, con su índice), listo para mostrar bajo el input. */
export function getFieldError(errors: FieldErrors | undefined, field: string): string | undefined {
  return errors?.[field]?.[0];
}

export function getPhoneFieldError(errors: FieldErrors | undefined, index: number, field: 'type' | 'number'): string | undefined {
  return getFieldError(errors, `phones.${index}.${field}`);
}
