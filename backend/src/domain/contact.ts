import { randomUUID } from 'node:crypto';

export type PhoneType = 'mobile' | 'home' | 'work' | 'other';

export interface Phone {
  id: string;
  type: PhoneType;
  number: string;
}

/** Entidad de dominio. `phones` siempre viene ya normalizado (10 dígitos). */
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  favorite: boolean;
  phones: Phone[];
  createdAt: Date;
  updatedAt: Date;
}

/** Datos ya validados por Zod, listos para crear o reemplazar un contacto. */
export interface ContactInput {
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  favorite: boolean;
  phones: Array<{ type: PhoneType; number: string }>;
}

export interface PhoneDto {
  type: PhoneType;
  number: string;
}

/** Forma de salida de la API: `snake_case`, igual que el contrato de ATL. */
export interface ContactDto {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  favorite: boolean;
  phones: PhoneDto[];
  created_at: string;
  updated_at: string;
}

function toPhone(input: { type: PhoneType; number: string }): Phone {
  return { id: randomUUID(), type: input.type, number: input.number };
}

/** Construye un contacto nuevo con id y timestamps generados por el servidor. */
export function createNewContact(input: ContactInput): Contact {
  const now = new Date();

  return {
    id: randomUUID(),
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    company: input.company,
    favorite: input.favorite,
    phones: input.phones.map(toPhone),
    createdAt: now,
    updatedAt: now,
  };
}

/** Reemplaza los datos de un contacto existente (PUT): conserva `id`/`createdAt`. */
export function replaceContact(existing: Contact, input: ContactInput): Contact {
  return {
    ...existing,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    company: input.company,
    favorite: input.favorite,
    phones: input.phones.map(toPhone),
    updatedAt: new Date(),
  };
}

/** Aplica una actualización parcial (PATCH) sobre un contacto existente. */
export function patchContact(existing: Contact, input: Partial<ContactInput>): Contact {
  return {
    ...existing,
    firstName: input.firstName ?? existing.firstName,
    lastName: input.lastName ?? existing.lastName,
    email: input.email ?? existing.email,
    company: input.company !== undefined ? input.company : existing.company,
    favorite: input.favorite ?? existing.favorite,
    phones: input.phones ? input.phones.map(toPhone) : existing.phones,
    updatedAt: new Date(),
  };
}

export function toContactDto(contact: Contact): ContactDto {
  return {
    id: contact.id,
    first_name: contact.firstName,
    last_name: contact.lastName,
    email: contact.email,
    company: contact.company,
    favorite: contact.favorite,
    phones: contact.phones.map((phone) => ({ type: phone.type, number: phone.number })),
    created_at: contact.createdAt.toISOString(),
    updated_at: contact.updatedAt.toISOString(),
  };
}
