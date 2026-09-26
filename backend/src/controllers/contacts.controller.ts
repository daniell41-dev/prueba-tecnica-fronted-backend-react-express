import type { Request, Response } from 'express';
import type { ContactInput } from '../domain/contact.js';
import { toContactDto } from '../domain/contact.js';
import { NotFoundError } from '../errors/app-error.js';
import type { CreateContactBody, PatchContactBody } from '../schemas/contact.schema.js';
import type { ImportContactsBody } from '../schemas/import-contacts.schema.js';
import { listContactsQuerySchema } from '../schemas/list-contacts-query.schema.js';
import type { ContactImportService } from '../services/contact-import.service.js';
import type { ContactsService } from '../services/contacts.service.js';
import { isUuid } from '../utils/uuid.js';

/** El body ya validado viene en `snake_case` (el contrato HTTP); el dominio habla `camelCase`. */
function toContactInput(body: CreateContactBody): ContactInput {
  return {
    firstName: body.first_name,
    lastName: body.last_name,
    email: body.email,
    company: body.company,
    favorite: body.favorite,
    phones: body.phones,
  };
}

function toPartialContactInput(body: PatchContactBody): Partial<ContactInput> {
  const input: Partial<ContactInput> = {};
  if (body.first_name !== undefined) input.firstName = body.first_name;
  if (body.last_name !== undefined) input.lastName = body.last_name;
  if (body.email !== undefined) input.email = body.email;
  if (body.company !== undefined) input.company = body.company;
  if (body.favorite !== undefined) input.favorite = body.favorite;
  if (body.phones !== undefined) input.phones = body.phones;
  return input;
}

/**
 * Traduce HTTP ↔ caso de uso, nada más — equivalente de `ContactController`
 * en la versión PHP: no valida reglas de negocio, no toca SQL. Todas las
 * acciones son `async`; en Express 5, si la promesa rechaza, Express la
 * reenvía sola a `errorHandler` sin necesidad de un `try/catch` manual ni de
 * un wrapper `asyncHandler` (la mejora frente a Express 4 que documenta
 * `docs/03-fundamentos-node-express.md`).
 */
export class ContactsController {
  constructor(
    private readonly service: ContactsService,
    private readonly importService: ContactImportService,
  ) {}

  index = async (req: Request, res: Response): Promise<void> => {
    // Query params: se parsean aquí, no con `validateBody` — `req.query` es
    // un getter en Express 5 y no se puede reasignar como `req.body`.
    const query = listContactsQuerySchema.parse(req.query);
    const { contacts, meta } = await this.service.list(query);
    res.json({ contacts: contacts.map(toContactDto), meta });
  };

  stats = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.service.stats());
  };

  show = async (req: Request, res: Response): Promise<void> => {
    const contact = await this.service.find(this.requireUuid(req.params.id));
    res.json({ contact: toContactDto(contact) });
  };

  store = async (req: Request, res: Response): Promise<void> => {
    const contact = await this.service.create(toContactInput(req.body as CreateContactBody));
    res.status(201).location(`/api/contacts/${contact.id}`).json({ contact: toContactDto(contact) });
  };

  replace = async (req: Request, res: Response): Promise<void> => {
    const id = this.requireUuid(req.params.id);
    const contact = await this.service.replace(id, toContactInput(req.body as CreateContactBody));
    res.json({ contact: toContactDto(contact) });
  };

  patch = async (req: Request, res: Response): Promise<void> => {
    const id = this.requireUuid(req.params.id);
    const contact = await this.service.patch(id, toPartialContactInput(req.body as PatchContactBody));
    res.json({ contact: toContactDto(contact) });
  };

  destroy = async (req: Request, res: Response): Promise<void> => {
    await this.service.remove(this.requireUuid(req.params.id));
    res.status(204).send();
  };

  import = async (req: Request, res: Response): Promise<void> => {
    const { count } = req.body as ImportContactsBody;
    res.json(await this.importService.importRandom(count));
  };

  /** Un id mal formado responde 404, no dispara una query rota contra Postgres. */
  private requireUuid(id: unknown): string {
    if (typeof id !== 'string' || !isUuid(id)) {
      throw NotFoundError.forContact(typeof id === 'string' ? id : String(id));
    }
    return id;
  }
}
