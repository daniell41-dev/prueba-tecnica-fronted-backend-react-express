import { describe, expect, it } from 'vitest';
import { isWellFormedPhone, normalizePhone, PHONE_DIGITS } from '../../src/utils/phone.js';

describe('isWellFormedPhone', () => {
  it('acepta dígitos con separadores comunes y una lada opcional', () => {
    expect(isWellFormedPhone('+52 55 1234 5678')).toBe(true);
    expect(isWellFormedPhone('(55) 1234-5678')).toBe(true);
    expect(isWellFormedPhone('5512345678')).toBe(true);
  });

  it('rechaza letras u otros caracteres — el bug real que corrigió la versión PHP', () => {
    expect(isWellFormedPhone('+52 abc55 1234 5678')).toBe(false);
    expect(isWellFormedPhone('55-1234-56AB')).toBe(false);
  });
});

describe('normalizePhone', () => {
  it('deja solo dígitos', () => {
    expect(normalizePhone('55 1234 5678')).toBe('5512345678');
  });

  it('quita la lada de México cuando el número normaliza a 10+2 dígitos', () => {
    const normalized = normalizePhone('+52 55 1234 5678');
    expect(normalized).toBe('5512345678');
    expect(normalized).toHaveLength(PHONE_DIGITS);
  });

  it('no toca el número si no coincide con el patrón de la lada MX', () => {
    expect(normalizePhone('12345')).toBe('12345');
  });
});
