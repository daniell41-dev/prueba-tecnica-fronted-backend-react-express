import { describe, expect, it } from 'vitest';
import { createContactSchema, patchContactSchema } from '../../src/schemas/contact.schema.js';

const validPayload = {
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engine',
  phones: [{ type: 'mobile', number: '+52 55 1111 2222' }],
};

describe('createContactSchema', () => {
  it('acepta un payload válido y normaliza el teléfono a 10 dígitos', () => {
    const result = createContactSchema.parse(validPayload);
    expect(result.phones[0]?.number).toBe('5511112222');
    expect(result.email).toBe('ada@example.com');
  });

  it('rellena favorite=false y phones=[] cuando no vienen', () => {
    const result = createContactSchema.parse({ first_name: 'Ana', last_name: 'Ruiz', email: 'ana@example.com' });
    expect(result.favorite).toBe(false);
    expect(result.phones).toEqual([]);
  });

  it('rechaza campos vacíos con un mensaje por campo', () => {
    const result = createContactSchema.safeParse({ first_name: '', last_name: '', email: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path.join('.'));
      expect(fields).toContain('first_name');
      expect(fields).toContain('last_name');
      expect(fields).toContain('email');
    }
  });

  it('rechaza un nombre con dígitos', () => {
    const result = createContactSchema.safeParse({ ...validPayload, first_name: 'Ada2' });
    expect(result.success).toBe(false);
  });

  it('rechaza un teléfono con letras (el bug real que corrigió la versión PHP)', () => {
    const result = createContactSchema.safeParse({ ...validPayload, phones: [{ number: '+52 abc55 1234 5678' }] });
    expect(result.success).toBe(false);
  });

  it('rechaza teléfonos duplicados dentro del mismo contacto, en la clave phones.<índice>.number', () => {
    const result = createContactSchema.safeParse({
      ...validPayload,
      phones: [{ number: '5511112222' }, { number: '55 1111 2222' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path.join('.'));
      expect(fields).toContain('phones.0.number');
      expect(fields).toContain('phones.1.number');
    }
  });

  it('rechaza más de 10 teléfonos', () => {
    const phones = Array.from({ length: 11 }, (_, index) => ({ number: `55000000${String(index).padStart(2, '0')}` }));
    const result = createContactSchema.safeParse({ ...validPayload, phones });
    expect(result.success).toBe(false);
  });
});

describe('patchContactSchema', () => {
  it('permite mandar solo favorite, sin tocar el resto de los campos (ni siquiera con un default)', () => {
    const result = patchContactSchema.parse({ favorite: true });
    expect(result).toEqual({ favorite: true });
  });

  it('distingue company: null (borrar la empresa) de company ausente (no tocarla)', () => {
    expect(patchContactSchema.parse({ company: null })).toEqual({ company: null });
    expect(patchContactSchema.parse({})).toEqual({});
  });

  it('sigue validando el teléfono si se manda', () => {
    const result = patchContactSchema.safeParse({ phones: [{ number: 'no-es-un-telefono' }] });
    expect(result.success).toBe(false);
  });
});
