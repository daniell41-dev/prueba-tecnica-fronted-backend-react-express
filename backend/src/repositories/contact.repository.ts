import type { Contact } from '../domain/contact.js';

export interface ContactFilters {
  search?: string;
  favorite?: boolean;
}

export interface ContactSort {
  sort: 'first_name' | 'last_name' | 'created_at';
  order: 'asc' | 'desc';
}

export interface Pagination {
  page: number;
  limit: number;
}

export interface CompanyCount {
  company: string;
  count: number;
}

/**
 * Contrato de acceso a datos de contactos (patrón Repository) — equivalente
 * de `ContactRepositoryInterface` en la versión PHP. `ContactsService` solo
 * conoce esta interfaz, nunca `PgContactRepository` directamente
 * (Dependency Inversion): así los tests de servicio/API usan
 * `tests/helpers/in-memory-contact.repository.ts` sin tocar Postgres.
 */
export interface ContactRepository {
  findMany(filters: ContactFilters, sort: ContactSort, pagination: Pagination): Promise<Contact[]>;
  count(filters: ContactFilters): Promise<number>;
  find(id: string): Promise<Contact | null>;
  emailExists(email: string, excludeId?: string): Promise<boolean>;
  create(contact: Contact): Promise<void>;
  update(contact: Contact): Promise<void>;
  delete(id: string): Promise<boolean>;
  countTotal(): Promise<number>;
  countFavorites(): Promise<number>;
  topCompanies(limit: number): Promise<CompanyCount[]>;
}
