import type { Contact } from '../../src/domain/contact.js';
import type {
  CompanyCount,
  ContactFilters,
  ContactRepository,
  ContactSort,
  Pagination,
} from '../../src/repositories/contact.repository.js';

const SORT_KEYS: Record<ContactSort['sort'], 'firstName' | 'lastName' | 'createdAt'> = {
  first_name: 'firstName',
  last_name: 'lastName',
  created_at: 'createdAt',
};

/**
 * Implementación en memoria de `ContactRepository` — port del
 * `InMemoryContactRepository` de PHP. La usan los tests unitarios y de API
 * (`tests/unit`, `tests/api`) que necesitan un repositorio real (para probar
 * unicidad de email, paginación, filtros...) sin pagar el costo de Postgres;
 * esa cobertura vive en `tests/integration/pg-contact.repository.test.ts`.
 */
export class InMemoryContactRepository implements ContactRepository {
  private readonly contacts = new Map<string, Contact>();

  async findMany(filters: ContactFilters, sort: ContactSort, pagination: Pagination): Promise<Contact[]> {
    const sorted = this.sort(this.filter(filters), sort);
    const start = (pagination.page - 1) * pagination.limit;
    return sorted.slice(start, start + pagination.limit);
  }

  async count(filters: ContactFilters): Promise<number> {
    return this.filter(filters).length;
  }

  async find(id: string): Promise<Contact | null> {
    return this.contacts.get(id) ?? null;
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    return [...this.contacts.values()].some(
      (contact) => contact.id !== excludeId && contact.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async create(contact: Contact): Promise<void> {
    this.contacts.set(contact.id, contact);
  }

  async update(contact: Contact): Promise<void> {
    this.contacts.set(contact.id, contact);
  }

  async delete(id: string): Promise<boolean> {
    return this.contacts.delete(id);
  }

  async countTotal(): Promise<number> {
    return this.contacts.size;
  }

  async countFavorites(): Promise<number> {
    return [...this.contacts.values()].filter((contact) => contact.favorite).length;
  }

  async topCompanies(limit: number): Promise<CompanyCount[]> {
    const counts = new Map<string, number>();
    for (const contact of this.contacts.values()) {
      if (!contact.company) {
        continue;
      }
      counts.set(contact.company, (counts.get(contact.company) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private filter(filters: ContactFilters): Contact[] {
    return [...this.contacts.values()].filter((contact) => {
      if (filters.favorite !== undefined && contact.favorite !== filters.favorite) {
        return false;
      }
      if (filters.search) {
        const haystack = `${contact.firstName} ${contact.lastName} ${contact.email} ${contact.company ?? ''}`.toLowerCase();
        return haystack.includes(filters.search.toLowerCase());
      }
      return true;
    });
  }

  private sort(contacts: Contact[], sort: ContactSort): Contact[] {
    const key = SORT_KEYS[sort.sort];
    const factor = sort.order === 'desc' ? -1 : 1;

    return [...contacts].sort((a, b) => {
      if (a[key] < b[key]) return -1 * factor;
      if (a[key] > b[key]) return 1 * factor;
      return 0;
    });
  }
}
