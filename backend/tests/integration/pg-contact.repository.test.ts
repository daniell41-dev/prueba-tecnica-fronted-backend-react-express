import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createNewContact } from '../../src/domain/contact.js';
import { PgContactRepository } from '../../src/repositories/pg-contact.repository.js';
import { applyMigrations, createTestPool, truncateAll } from './helpers/db.js';

/**
 * Ejercita `PgContactRepository` contra un Postgres real (ver
 * `docs/07-docker-desktop.md` para levantarlo, o `docs/05-postgresql-y-pg.md`
 * para correrlo sin Docker). La cobertura de reglas de negocio (409, 422...)
 * ya vive en `tests/api/` con el repositorio en memoria — aquí solo se
 * verifica que las queries SQL hacen lo que dicen: transacciones, la
 * restricción única de `email`, el borrado en cascada de teléfonos.
 */
describe('PgContactRepository (Postgres real)', () => {
  let pool: Pool;
  let repository: PgContactRepository;

  beforeAll(async () => {
    pool = createTestPool();
    await applyMigrations(pool);
  });

  beforeEach(async () => {
    await truncateAll(pool);
    repository = new PgContactRepository(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('crea un contacto con sus teléfonos y lo puede volver a leer', async () => {
    const contact = createNewContact({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      company: 'Analytical Engine',
      favorite: true,
      phones: [
        { type: 'mobile', number: '5511112222' },
        { type: 'work', number: '5533334444' },
      ],
    });

    await repository.create(contact);
    const found = await repository.find(contact.id);

    expect(found?.email).toBe('ada@example.com');
    expect(found?.phones.map((phone) => phone.number)).toEqual(['5511112222', '5533334444']);
  });

  it('find devuelve null si el id no existe', async () => {
    expect(await repository.find('6f9619ff-8b86-d011-b42d-00cf4fc964ff')).toBeNull();
  });

  it('emailExists es case-insensitive y respeta excludeId', async () => {
    const contact = createNewContact({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      company: null,
      favorite: false,
      phones: [],
    });
    await repository.create(contact);

    expect(await repository.emailExists('ADA@example.com')).toBe(true);
    expect(await repository.emailExists('ada@example.com', contact.id)).toBe(false);
  });

  it('update reemplaza los teléfonos por completo, dentro de una transacción', async () => {
    const contact = createNewContact({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      company: null,
      favorite: false,
      phones: [{ type: 'mobile', number: '5511112222' }],
    });
    await repository.create(contact);

    await repository.update({
      ...contact,
      phones: [{ id: randomUUID(), type: 'work', number: '5533334444' }],
      updatedAt: new Date(),
    });

    const found = await repository.find(contact.id);
    expect(found?.phones).toHaveLength(1);
    expect(found?.phones[0]?.number).toBe('5533334444');
  });

  it('crear con un email duplicado dispara la restricción única de Postgres (23505)', async () => {
    const first = createNewContact({ firstName: 'Ada', lastName: 'Lovelace', email: 'dup@example.com', company: null, favorite: false, phones: [] });
    const second = createNewContact({ firstName: 'Otra', lastName: 'Persona', email: 'dup@example.com', company: null, favorite: false, phones: [] });
    await repository.create(first);

    await expect(repository.create(second)).rejects.toMatchObject({ code: '23505' });
  });

  it('delete borra el contacto y sus teléfonos en cascada', async () => {
    const contact = createNewContact({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      company: null,
      favorite: false,
      phones: [{ type: 'mobile', number: '5511112222' }],
    });
    await repository.create(contact);

    expect(await repository.delete(contact.id)).toBe(true);
    expect(await repository.find(contact.id)).toBeNull();

    const remainingPhones = await pool.query('SELECT 1 FROM phones WHERE contact_id = $1', [contact.id]);
    expect(remainingPhones.rowCount).toBe(0);
  });

  it('delete devuelve false si el id no existía', async () => {
    expect(await repository.delete('6f9619ff-8b86-d011-b42d-00cf4fc964ff')).toBe(false);
  });

  it('findMany filtra por favorite y ordena por first_name', async () => {
    await repository.create(createNewContact({ firstName: 'Beto', lastName: 'Ruiz', email: 'beto@example.com', company: 'Acme', favorite: true, phones: [] }));
    await repository.create(createNewContact({ firstName: 'Ana', lastName: 'Gómez', email: 'ana@example.com', company: 'Acme', favorite: false, phones: [] }));

    const favorites = await repository.findMany({ favorite: true }, { sort: 'first_name', order: 'asc' }, { page: 1, limit: 10 });
    expect(favorites.map((contact) => contact.firstName)).toEqual(['Beto']);

    const all = await repository.findMany({}, { sort: 'first_name', order: 'asc' }, { page: 1, limit: 10 });
    expect(all.map((contact) => contact.firstName)).toEqual(['Ana', 'Beto']);
  });

  it('findMany pagina correctamente (page 2 no repite ni salta filas)', async () => {
    await repository.create(createNewContact({ firstName: 'Ana', lastName: 'A', email: 'ana@example.com', company: null, favorite: false, phones: [] }));
    await repository.create(createNewContact({ firstName: 'Beto', lastName: 'B', email: 'beto@example.com', company: null, favorite: false, phones: [] }));
    await repository.create(createNewContact({ firstName: 'Carla', lastName: 'C', email: 'carla@example.com', company: null, favorite: false, phones: [] }));

    const sort = { sort: 'first_name' as const, order: 'asc' as const };
    const firstPage = await repository.findMany({}, sort, { page: 1, limit: 2 });
    const secondPage = await repository.findMany({}, sort, { page: 2, limit: 2 });

    expect(firstPage.map((contact) => contact.firstName)).toEqual(['Ana', 'Beto']);
    expect(secondPage.map((contact) => contact.firstName)).toEqual(['Carla']);
  });

  it('countTotal/countFavorites/topCompanies agregan correctamente', async () => {
    await repository.create(createNewContact({ firstName: 'Beto', lastName: 'Ruiz', email: 'beto@example.com', company: 'Acme', favorite: true, phones: [] }));
    await repository.create(createNewContact({ firstName: 'Ana', lastName: 'Gómez', email: 'ana@example.com', company: 'Acme', favorite: false, phones: [] }));

    expect(await repository.countTotal()).toBe(2);
    expect(await repository.countFavorites()).toBe(1);
    expect(await repository.topCompanies(5)).toEqual([{ company: 'Acme', count: 2 }]);
  });
});
