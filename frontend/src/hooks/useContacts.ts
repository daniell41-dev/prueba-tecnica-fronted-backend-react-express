import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteContact, importContacts, listContacts, patchContact } from '../api/contacts.api.js';
import type { ContactDto, ContactFilters, PaginationMeta } from '../types/contact.js';
import { toErrorMessage } from '../utils/errors.js';
import { useDebouncedValue } from './useDebouncedValue.js';

const DEFAULT_FILTERS: ContactFilters = { page: 1, limit: 10, sort: 'first_name', order: 'asc' };
const EMPTY_META: PaginationMeta = { page: 1, limit: 10, total: 0, total_pages: 1 };

/**
 * Todo el estado de `ContactsPage`: filtros + paginación + las acciones
 * (favorito, borrar, importar). La búsqueda se debounce aquí (no en
 * `SearchBar`, que se queda puramente controlado) para no disparar una
 * request por cada tecla — ver kata 2 (`docs/ejercicios/`).
 */
export function useContacts() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [filters, setFiltersState] = useState<ContactFilters>(DEFAULT_FILTERS);
  const [contacts, setContacts] = useState<ContactDto[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const effectiveFilters = useMemo<ContactFilters>(
    () => ({ ...filters, search: debouncedSearch.trim() || undefined }),
    [filters, debouncedSearch],
  );

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listContacts(effectiveFilters);
      setContacts(response.contacts);
      setMeta(response.meta);
    } catch (fetchError) {
      setError(toErrorMessage(fetchError));
    } finally {
      setIsLoading(false);
    }
  }, [effectiveFilters]);

  useEffect(() => {
    void fetchContacts();
  }, [fetchContacts]);

  /** Cambiar de página nunca resetea los demás filtros. */
  function setPage(page: number): void {
    setFiltersState((previous) => ({ ...previous, page }));
  }

  /** Cambiar cualquier otro filtro (búsqueda, favorito, orden) siempre vuelve a la página 1. */
  function setFilter(patch: Partial<Omit<ContactFilters, 'page'>>): void {
    if (patch.search !== undefined) {
      setSearchInput(patch.search);
    }
    const { search: _search, ...rest } = patch;
    setFiltersState((previous) => ({ ...previous, ...rest, page: 1 }));
  }

  async function toggleFavorite(contact: ContactDto): Promise<void> {
    try {
      await patchContact(contact.id, { favorite: !contact.favorite });
      await fetchContacts();
    } catch (toggleError) {
      setError(toErrorMessage(toggleError));
    }
  }

  async function removeContact(id: string): Promise<void> {
    try {
      await deleteContact(id);
      await fetchContacts();
    } catch (removeError) {
      setError(toErrorMessage(removeError));
    }
  }

  async function runImport(count: number): Promise<void> {
    setIsImporting(true);
    setError(null);
    try {
      await importContacts(count);
      await fetchContacts();
    } catch (importError) {
      setError(toErrorMessage(importError));
    } finally {
      setIsImporting(false);
    }
  }

  return {
    contacts,
    meta,
    isLoading,
    error,
    isImporting,
    filters: { ...filters, search: searchInput },
    setPage,
    setFilter,
    toggleFavorite,
    removeContact,
    runImport,
  };
}
