/**
 * Espejo exacto del contrato de la API (`docs/08-api-reference.md`), en
 * `snake_case` — igual que el DTO que ya usa el frontend Angular hermano
 * (`prueba-tecnica-fronted-atl/src/app/core/repositories/contact.dto.ts`).
 */
export type PhoneType = 'mobile' | 'home' | 'work' | 'other';

export interface PhoneDto {
  type: PhoneType;
  number: string;
}

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

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ContactsListResponse {
  contacts: ContactDto[];
  meta: PaginationMeta;
}

export interface ContactResponse {
  contact: ContactDto;
}

export interface CompanyCount {
  company: string;
  count: number;
}

export interface ContactStats {
  total: number;
  favorites: number;
  top_companies: CompanyCount[];
}

export interface ImportResult {
  imported: number;
  failed: number;
}

/** Lo que manda `useContacts` a `GET /api/contacts`. `favorite` ya viene como el string que espera el query param. */
export interface ContactFilters {
  page: number;
  limit: number;
  search?: string;
  favorite?: 'true' | 'false';
  sort: 'first_name' | 'last_name' | 'created_at';
  order: 'asc' | 'desc';
}

/** Body de `POST`/`PUT /api/contacts` — mismas reglas que valida el backend con Zod. */
export interface ContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  favorite: boolean;
  phones: PhoneDto[];
}

export type ContactPatchPayload = Partial<ContactPayload>;
