import { describe, expect, it } from 'vitest';
import type { ContactDto } from '../../src/types/contact.js';
import {
  contactToFormValues,
  createEmptyFormValues,
  createEmptyPhone,
  formValuesToPayload,
  getSubmitLabel,
} from '../../src/utils/contact-form.js';

describe('formValuesToPayload', () => {
  it('recorta espacios y convierte una empresa vacía a null', () => {
    const values = createEmptyFormValues();
    values.first_name = '  Ada  ';
    values.last_name = 'Lovelace';
    values.email = 'ada@example.com';
    values.company = '   ';

    const payload = formValuesToPayload(values);

    expect(payload.first_name).toBe('Ada');
    expect(payload.company).toBeNull();
  });

  it('omite las filas de teléfono en blanco', () => {
    const values = createEmptyFormValues();
    values.phones = [createEmptyPhone(), { ...createEmptyPhone(), number: '5511112222' }];

    const payload = formValuesToPayload(values);

    expect(payload.phones).toHaveLength(1);
    expect(payload.phones[0]?.number).toBe('5511112222');
  });
});

describe('contactToFormValues', () => {
  it('usa "" cuando company es null', () => {
    const contact: ContactDto = {
      id: '1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
      company: null,
      favorite: false,
      phones: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    expect(contactToFormValues(contact).company).toBe('');
  });
});

describe('getSubmitLabel', () => {
  it('prioriza "Guardando…" sobre editar/crear (evita un ternario anidado en el componente)', () => {
    expect(getSubmitLabel(true, true)).toBe('Guardando…');
    expect(getSubmitLabel(true, false)).toBe('Guardando…');
  });

  it('distingue editar de crear cuando no está enviando', () => {
    expect(getSubmitLabel(false, true)).toBe('Guardar cambios');
    expect(getSubmitLabel(false, false)).toBe('Crear contacto');
  });
});
