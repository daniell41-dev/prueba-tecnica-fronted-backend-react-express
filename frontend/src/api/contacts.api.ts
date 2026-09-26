import type {
  ContactFilters,
  ContactPatchPayload,
  ContactPayload,
  ContactResponse,
  ContactStats,
  ContactsListResponse,
  ImportResult,
} from '../types/contact.js';
import { apiFetch } from './http.js';

function toQueryString(filters: ContactFilters): string {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  params.set('sort', filters.sort);
  params.set('order', filters.order);
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.favorite) {
    params.set('favorite', filters.favorite);
  }
  return params.toString();
}

export function listContacts(filters: ContactFilters): Promise<ContactsListResponse> {
  return apiFetch<ContactsListResponse>(`/contacts?${toQueryString(filters)}`);
}

export function getContact(id: string): Promise<ContactResponse> {
  return apiFetch<ContactResponse>(`/contacts/${id}`);
}

export function getContactStats(): Promise<ContactStats> {
  return apiFetch<ContactStats>('/contacts/stats');
}

export function createContact(payload: ContactPayload): Promise<ContactResponse> {
  return apiFetch<ContactResponse>('/contacts', { method: 'POST', body: JSON.stringify(payload) });
}

export function replaceContact(id: string, payload: ContactPayload): Promise<ContactResponse> {
  return apiFetch<ContactResponse>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function patchContact(id: string, payload: ContactPatchPayload): Promise<ContactResponse> {
  return apiFetch<ContactResponse>(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function deleteContact(id: string): Promise<null> {
  return apiFetch<null>(`/contacts/${id}`, { method: 'DELETE' });
}

export function importContacts(count: number): Promise<ImportResult> {
  return apiFetch<ImportResult>('/contacts/import', { method: 'POST', body: JSON.stringify({ count }) });
}
