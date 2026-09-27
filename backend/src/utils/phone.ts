/**
 * Normalización de números telefónicos — port 1:1 de `App\Support\PhoneNumber`
 * (`prueba-tecnica-backend-atl/src/Support/PhoneNumber.php`), que a su vez
 * replica `normalizePhoneNumber` del frontend Angular. Los tres proyectos
 * guardan el mismo formato: 10 dígitos, sin lada de México.
 */
const MX_COUNTRY_CODE = '52';
export const PHONE_DIGITS = 10;

/**
 * Caracteres admitidos al capturar un teléfono: dígitos y separadores
 * habituales, con un `+` opcional al inicio para la lada.
 */
const FORMAT_PATTERN = /^\+?[0-9\s\-().]+$/;

/**
 * Si el texto solo contiene caracteres propios de un teléfono.
 *
 * Se pregunta **antes** de normalizar: `normalizePhone` descarta todo lo que
 * no sea dígito, así que no distingue un separador legítimo de basura — sin
 * esta comprobación, `"+52 abc55 1234 5678"` se convertiría en un número de
 * 10 dígitos perfectamente válido y se guardaría como tal (el bug real que
 * corrigió la versión PHP durante QA manual).
 */
export function isWellFormedPhone(raw: string): boolean {
  return FORMAT_PATTERN.test(raw.trim());
}

/** `+52 55 1234 5678` → `5512345678`. Deja solo dígitos y quita la lada MX si aplica. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  if (digits.length === PHONE_DIGITS + MX_COUNTRY_CODE.length && digits.startsWith(MX_COUNTRY_CODE)) {
    return digits.slice(MX_COUNTRY_CODE.length);
  }

  return digits;
}
