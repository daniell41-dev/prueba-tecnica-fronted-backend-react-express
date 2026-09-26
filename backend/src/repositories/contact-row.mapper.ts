import type { Contact, Phone, PhoneType } from '../domain/contact.js';

/** Fila cruda de la tabla `contacts` tal como la devuelve `pg`. */
export interface ContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  favorite: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Fila cruda de la tabla `phones`. */
export interface PhoneRow {
  id: string;
  contact_id: string;
  type: PhoneType;
  number: string;
  position: number;
}

export function mapPhoneRow(row: PhoneRow): Phone {
  return { id: row.id, type: row.type, number: row.number };
}

/** Agrupa teléfonos por `contact_id`, ya ordenados por `position` (viene así de SQL). */
export function groupPhonesByContact(rows: PhoneRow[]): Map<string, Phone[]> {
  const grouped = new Map<string, Phone[]>();

  for (const row of rows) {
    const phones = grouped.get(row.contact_id) ?? [];
    phones.push(mapPhoneRow(row));
    grouped.set(row.contact_id, phones);
  }

  return grouped;
}

export function hydrateContact(row: ContactRow, phones: Phone[]): Contact {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    company: row.company,
    favorite: row.favorite,
    phones,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
