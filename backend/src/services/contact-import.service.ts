import type { RandomUserClient, RandomUserSummary } from '../clients/random-user.client.js';
import { createNewContact, type Contact, type PhoneType } from '../domain/contact.js';
import { ConflictError } from '../errors/app-error.js';
import type { ContactRepository } from '../repositories/contact.repository.js';
import { isWellFormedPhone, normalizePhone, PHONE_DIGITS } from '../utils/phone.js';

export interface ImportResult {
  imported: number;
  failed: number;
}

const IMPORTED_PHONE_TYPE: PhoneType = 'mobile';

/** Si el teléfono que trajo la API externa no normaliza a 10 dígitos, se omite en vez de rechazar todo el contacto. */
function buildPhonesFromRawNumber(rawPhone: string): Array<{ type: PhoneType; number: string }> {
  if (!isWellFormedPhone(rawPhone)) {
    return [];
  }
  const normalized = normalizePhone(rawPhone);
  return normalized.length === PHONE_DIGITS ? [{ type: IMPORTED_PHONE_TYPE, number: normalized }] : [];
}

/**
 * Caso de uso "importar contactos desde una API externa". Ejercita
 * `Promise.allSettled`: un contacto que falla (email duplicado, lo que sea)
 * no debe tirar abajo la importación completa de los demás.
 */
export class ContactImportService {
  constructor(
    private readonly contacts: ContactRepository,
    private readonly randomUserClient: RandomUserClient,
  ) {}

  async importRandom(count: number): Promise<ImportResult> {
    const people = await this.randomUserClient.fetchRandomPeople(count);
    const results = await Promise.allSettled(people.map((person) => this.createFromRandomUser(person)));

    const imported = results.filter((result) => result.status === 'fulfilled').length;
    const failed = results.length - imported;

    return { imported, failed };
  }

  private async createFromRandomUser(person: RandomUserSummary): Promise<Contact> {
    if (await this.contacts.emailExists(person.email)) {
      throw new ConflictError(`El correo "${person.email}" ya está registrado.`);
    }

    const contact = createNewContact({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      company: person.company,
      favorite: false,
      phones: buildPhonesFromRawNumber(person.phone),
    });

    await this.contacts.create(contact);
    return contact;
  }
}
