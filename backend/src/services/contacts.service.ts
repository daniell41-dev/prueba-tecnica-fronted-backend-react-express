import type { Contact, ContactInput } from '../domain/contact.js';
import { createNewContact, patchContact, replaceContact } from '../domain/contact.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';
import type { ContactRepository } from '../repositories/contact.repository.js';
import type { ListContactsQuery } from '../schemas/list-contacts-query.schema.js';
import { buildPaginationMeta, type PaginationMeta } from '../utils/pagination.js';

export interface ContactsPage {
  contacts: Contact[];
  meta: PaginationMeta;
}

export interface ContactStats {
  total: number;
  favorites: number;
  top_companies: Array<{ company: string; count: number }>;
}

/**
 * Caso de uso "gestionar contactos" — equivalente de `ContactService` en la
 * versión PHP. Es la única puerta de entrada que conocen los controllers: no
 * saben de `pg` ni de Zod, solo de este servicio.
 */
export class ContactsService {
  constructor(private readonly repository: ContactRepository) {}

  /** Lista + cuenta el total en paralelo: son dos queries independientes, no hay razón para esperar una y luego la otra. */
  async list(query: ListContactsQuery): Promise<ContactsPage> {
    const filters = { search: query.search, favorite: query.favorite };
    const sort = { sort: query.sort, order: query.order };
    const pagination = { page: query.page, limit: query.limit };

    const [contacts, total] = await Promise.all([
      this.repository.findMany(filters, sort, pagination),
      this.repository.count(filters),
    ]);

    return { contacts, meta: buildPaginationMeta(query.page, query.limit, total) };
  }

  async find(id: string): Promise<Contact> {
    const contact = await this.repository.find(id);
    return contact ?? this.throwNotFound(id);
  }

  async create(input: ContactInput): Promise<Contact> {
    await this.assertEmailAvailable(input.email);
    const contact = createNewContact(input);
    await this.repository.create(contact);
    return contact;
  }

  async replace(id: string, input: ContactInput): Promise<Contact> {
    const existing = await this.find(id);
    await this.assertEmailAvailable(input.email, id);
    const updated = replaceContact(existing, input);
    await this.repository.update(updated);
    return updated;
  }

  async patch(id: string, input: Partial<ContactInput>): Promise<Contact> {
    const existing = await this.find(id);
    if (input.email) {
      await this.assertEmailAvailable(input.email, id);
    }
    const updated = patchContact(existing, input);
    await this.repository.update(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      this.throwNotFound(id);
    }
  }

  /** Tres queries de agregación independientes: se disparan a la vez con `Promise.all`. */
  async stats(): Promise<ContactStats> {
    const [total, favorites, topCompanies] = await Promise.all([
      this.repository.countTotal(),
      this.repository.countFavorites(),
      this.repository.topCompanies(5),
    ]);

    return { total, favorites, top_companies: topCompanies };
  }

  private async assertEmailAvailable(email: string, excludeId?: string): Promise<void> {
    if (await this.repository.emailExists(email, excludeId)) {
      throw new ConflictError('El correo ya está registrado.');
    }
  }

  private throwNotFound(id: string): never {
    throw NotFoundError.forContact(id);
  }
}
