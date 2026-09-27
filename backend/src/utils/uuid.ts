const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valida la *forma* de un UUID (no que exista en la base). Se usa en los
 * controllers antes de consultar el repositorio: un `id` mal formado (p. ej.
 * `"no-existe"`, o `"; DROP TABLE contacts"`) debe responder `404`, no
 * disparar una query rota ni un `500`.
 */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
