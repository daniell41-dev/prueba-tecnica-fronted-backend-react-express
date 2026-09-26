const PHONE_TYPE_LABELS: Record<string, string> = {
  mobile: 'Móvil',
  home: 'Casa',
  work: 'Trabajo',
  other: 'Otro',
};

/** `5512345678` → `55 1234 5678` — solo para mostrar; el valor guardado sigue siendo 10 dígitos. */
export function formatPhoneNumber(number: string): string {
  if (number.length !== 10) {
    return number;
  }
  return `${number.slice(0, 2)} ${number.slice(2, 6)} ${number.slice(6)}`;
}

export function formatPhoneType(type: string): string {
  return PHONE_TYPE_LABELS[type] ?? type;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}
