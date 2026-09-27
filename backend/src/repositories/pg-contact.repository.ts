import type { Pool, PoolClient } from 'pg';
import type { Contact } from '../domain/contact.js';
import { withTransaction } from '../db/transaction.js';
import type { CompanyCount, ContactFilters, ContactRepository, ContactSort, Pagination } from './contact.repository.js';
import { groupPhonesByContact, hydrateContact, type ContactRow, type PhoneRow } from './contact-row.mapper.js';

/**
 * Implementación de `ContactRepository` sobre `pg`. SQL estándar (sin
 * funciones específicas de un motor), como en `PdoContactRepository` de la
 * versión PHP. Todas las queries van parametrizadas (`$1`, `$2`...); el único
 * lugar donde eso no basta es `ORDER BY`, porque un identificador de columna
 * no se puede parametrizar — por eso `SORT_COLUMNS` actúa de whitelist.
 */
const SORT_COLUMNS: Record<ContactSort['sort'], string> = {
  first_name: 'first_name',
  last_name: 'last_name',
  created_at: 'created_at',
};

export class PgContactRepository implements ContactRepository {
  constructor(private readonly pool: Pool) {}

  async findMany(filters: ContactFilters, sort: ContactSort, pagination: Pagination): Promise<Contact[]> {
    const { whereSql, params } = this.buildWhere(filters);
    const column = SORT_COLUMNS[sort.sort];
    const direction = sort.order === 'desc' ? 'DESC' : 'ASC';
    const offset = (pagination.page - 1) * pagination.limit;

    const sql = `
      SELECT * FROM contacts
      ${whereSql}
      ORDER BY ${column} ${direction}, id ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const rows = await this.pool.query<ContactRow>(sql, [...params, pagination.limit, offset]);

    if (rows.rows.length === 0) {
      return [];
    }

    const phonesByContact = await this.phonesForContacts(rows.rows.map((row) => row.id));
    return rows.rows.map((row) => hydrateContact(row, phonesByContact.get(row.id) ?? []));
  }

  async count(filters: ContactFilters): Promise<number> {
    const { whereSql, params } = this.buildWhere(filters);
    const result = await this.pool.query<{ count: string }>(`SELECT COUNT(*) FROM contacts ${whereSql}`, params);
    return Number(result.rows[0]?.count ?? 0);
  }

  async find(id: string): Promise<Contact | null> {
    const result = await this.pool.query<ContactRow>('SELECT * FROM contacts WHERE id = $1', [id]);
    const row = result.rows[0];

    if (!row) {
      return null;
    }

    const phonesByContact = await this.phonesForContacts([id]);
    return hydrateContact(row, phonesByContact.get(id) ?? []);
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM contacts WHERE LOWER(email) = LOWER($1) AND ($2::uuid IS NULL OR id != $2) LIMIT 1',
      [email, excludeId ?? null],
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async create(contact: Contact): Promise<void> {
    await withTransaction(this.pool, async (client) => {
      await client.query(
        `INSERT INTO contacts (id, first_name, last_name, email, company, favorite, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [contact.id, contact.firstName, contact.lastName, contact.email, contact.company, contact.favorite, contact.createdAt, contact.updatedAt],
      );
      await this.insertPhones(client, contact);
    });
  }

  async update(contact: Contact): Promise<void> {
    await withTransaction(this.pool, async (client) => {
      await client.query(
        `UPDATE contacts
         SET first_name = $2, last_name = $3, email = $4, company = $5, favorite = $6, updated_at = $7
         WHERE id = $1`,
        [contact.id, contact.firstName, contact.lastName, contact.email, contact.company, contact.favorite, contact.updatedAt],
      );
      await client.query('DELETE FROM phones WHERE contact_id = $1', [contact.id]);
      await this.insertPhones(client, contact);
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM contacts WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async countTotal(): Promise<number> {
    const result = await this.pool.query<{ count: string }>('SELECT COUNT(*) FROM contacts');
    return Number(result.rows[0]?.count ?? 0);
  }

  async countFavorites(): Promise<number> {
    const result = await this.pool.query<{ count: string }>('SELECT COUNT(*) FROM contacts WHERE favorite = true');
    return Number(result.rows[0]?.count ?? 0);
  }

  async topCompanies(limit: number): Promise<CompanyCount[]> {
    const result = await this.pool.query<{ company: string; count: string }>(
      `SELECT company, COUNT(*) AS count FROM contacts
       WHERE company IS NOT NULL
       GROUP BY company
       ORDER BY count DESC, company ASC
       LIMIT $1`,
      [limit],
    );
    return result.rows.map((row) => ({ company: row.company, count: Number(row.count) }));
  }

  /**
   * Carga los teléfonos de varios contactos en **una sola query**, agrupados
   * por `contact_id` — evita el problema N+1 al listar (una query por
   * teléfono en vez de una por página completa), igual que
   * `phonesForContacts()` en la versión PHP.
   */
  private async phonesForContacts(contactIds: string[]): Promise<Map<string, Contact['phones']>> {
    if (contactIds.length === 0) {
      return new Map();
    }

    const result = await this.pool.query<PhoneRow>(
      'SELECT * FROM phones WHERE contact_id = ANY($1) ORDER BY contact_id, position',
      [contactIds],
    );
    return groupPhonesByContact(result.rows);
  }

  private async insertPhones(client: PoolClient, contact: Contact): Promise<void> {
    let position = 0;
    for (const phone of contact.phones) {
      await client.query(
        'INSERT INTO phones (id, contact_id, type, number, position) VALUES ($1, $2, $3, $4, $5)',
        [phone.id, contact.id, phone.type, phone.number, position],
      );
      position += 1;
    }
  }

  private buildWhere(filters: ContactFilters): { whereSql: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.search) {
      params.push(`%${filters.search}%`);
      const index = params.length;
      conditions.push(
        `(first_name ILIKE $${index} OR last_name ILIKE $${index} OR email ILIKE $${index} OR company ILIKE $${index})`,
      );
    }

    if (filters.favorite !== undefined) {
      params.push(filters.favorite);
      conditions.push(`favorite = $${params.length}`);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereSql, params };
  }
}
