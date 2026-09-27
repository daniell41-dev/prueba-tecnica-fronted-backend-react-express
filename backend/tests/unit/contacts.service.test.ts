import { beforeEach, describe, expect, it } from 'vitest';
import type { ContactInput } from '../../src/domain/contact.js';
import { ConflictError, NotFoundError } from '../../src/errors/app-error.js';
import { ContactsService } from '../../src/services/contacts.service.js';
import { InMemoryContactRepository } from '../helpers/in-memory-contact.repository.js';

function buildInput(overrides: Partial<ContactInput> = {}): ContactInput {
  return {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    company: null,
    favorite: false,
    phones: [],
    ...overrides,
  };
}

describe('ContactsService', () => {
  let repository: InMemoryContactRepository;
  let service: ContactsService;

  beforeEach(() => {
    repository = new InMemoryContactRepository();
    service = new ContactsService(repository);
  });

  it('crea un contacto y lo puede volver a encontrar', async () => {
    const created = await service.create(buildInput());
    const found = await service.find(created.id);
    expect(found.email).toBe('ada@example.com');
  });

  it('rechaza crear con un email ya registrado (409, no 422 — case-insensitive)', async () => {
    await service.create(buildInput());
    await expect(service.create(buildInput({ email: 'ADA@example.com' }))).rejects.toBeInstanceOf(ConflictError);
  });

  it('find lanza NotFoundError si el id no existe', async () => {
    await expect(service.find('no-existe')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('list pagina y filtra por favorite', async () => {
    await service.create(buildInput({ email: 'a@example.com', favorite: true }));
    await service.create(buildInput({ email: 'b@example.com', favorite: false }));

    const page = await service.list({ page: 1, limit: 10, sort: 'first_name', order: 'asc', favorite: true, search: undefined });

    expect(page.contacts).toHaveLength(1);
    expect(page.contacts[0]?.favorite).toBe(true);
    expect(page.meta).toEqual({ page: 1, limit: 10, total: 1, total_pages: 1 });
  });

  it('list filtra por búsqueda de texto sobre nombre/apellido/email/empresa', async () => {
    await service.create(buildInput({ email: 'ada@example.com', company: 'Analytical Engine' }));
    await service.create(buildInput({ email: 'grace@example.com', firstName: 'Grace', lastName: 'Hopper', company: 'US Navy' }));

    const page = await service.list({ page: 1, limit: 10, sort: 'first_name', order: 'asc', favorite: undefined, search: 'navy' });

    expect(page.contacts).toHaveLength(1);
    expect(page.contacts[0]?.lastName).toBe('Hopper');
  });

  it('replace conserva el id y reemplaza los teléfonos por completo', async () => {
    const created = await service.create(buildInput({ phones: [{ type: 'mobile', number: '5511112222' }] }));

    const replaced = await service.replace(created.id, buildInput({ phones: [{ type: 'work', number: '5533334444' }] }));

    expect(replaced.id).toBe(created.id);
    expect(replaced.phones).toHaveLength(1);
    expect(replaced.phones[0]?.number).toBe('5533334444');
  });

  it('patch con favorite=false no lo deja en el valor anterior (bug clásico de usar `||` en vez de `??`)', async () => {
    const created = await service.create(buildInput({ favorite: true }));
    const patched = await service.patch(created.id, { favorite: false });
    expect(patched.favorite).toBe(false);
  });

  it('patch conserva los campos que no se mandan', async () => {
    const created = await service.create(buildInput({ company: 'Analytical Engine' }));
    const patched = await service.patch(created.id, { favorite: true });
    expect(patched.company).toBe('Analytical Engine');
    expect(patched.firstName).toBe('Ada');
  });

  it('remove lanza NotFoundError si el id no existe', async () => {
    await expect(service.remove('no-existe')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('stats agrega total, favoritos y top empresas con Promise.all', async () => {
    await service.create(buildInput({ email: 'a@example.com', favorite: true, company: 'Acme' }));
    await service.create(buildInput({ email: 'b@example.com', favorite: false, company: 'Acme' }));
    await service.create(buildInput({ email: 'c@example.com', favorite: false, company: null }));

    const stats = await service.stats();

    expect(stats.total).toBe(3);
    expect(stats.favorites).toBe(1);
    expect(stats.top_companies[0]).toEqual({ company: 'Acme', count: 2 });
  });
});
