import type { Pool } from 'pg';
import { HttpRandomUserClient, type RandomUserClient } from './clients/random-user.client.js';
import { AuthController } from './controllers/auth.controller.js';
import { ContactsController } from './controllers/contacts.controller.js';
import { HealthController, type HealthCheck } from './controllers/health.controller.js';
import { PgContactRepository } from './repositories/pg-contact.repository.js';
import { PgUserRepository } from './repositories/pg-user.repository.js';
import type { ContactRepository } from './repositories/contact.repository.js';
import type { UserRepository } from './repositories/user.repository.js';
import { AuthService } from './services/auth.service.js';
import { ContactImportService } from './services/contact-import.service.js';
import { ContactsService } from './services/contacts.service.js';

/**
 * Composition root: el único lugar que instancia clases concretas y las
 * conecta entre sí (sin contenedor de DI — YAGNI, igual que
 * `public/index.php` en la versión PHP). `createApp()` (en `app.ts`) solo
 * conoce esta forma, nunca `pg`/`PgContactRepository` directamente — así los
 * tests de API pasan un `AppDependencies` armado con repositorios en
 * memoria (`tests/helpers/`) y nunca abren una conexión real a Postgres.
 */
export interface AppDependencies {
  healthController: HealthController;
  authController: AuthController;
  contactsController: ContactsController;
}

export interface ContainerOverrides {
  contactRepository?: ContactRepository;
  userRepository?: UserRepository;
  randomUserClient?: RandomUserClient;
  healthCheck?: HealthCheck;
}

function defaultHealthCheck(pool: Pool): HealthCheck {
  return {
    async ping() {
      await pool.query('SELECT 1');
    },
  };
}

/** Contenedor "de producción": todo respaldado por el `pool` real de Postgres. */
export function createContainer(pool: Pool, overrides: ContainerOverrides = {}): AppDependencies {
  const contactRepository = overrides.contactRepository ?? new PgContactRepository(pool);
  const userRepository = overrides.userRepository ?? new PgUserRepository(pool);
  const randomUserClient = overrides.randomUserClient ?? new HttpRandomUserClient();
  const healthCheck = overrides.healthCheck ?? defaultHealthCheck(pool);

  const contactsService = new ContactsService(contactRepository);
  const authService = new AuthService(userRepository);
  const importService = new ContactImportService(contactRepository, randomUserClient);

  return {
    healthController: new HealthController(healthCheck),
    authController: new AuthController(authService),
    contactsController: new ContactsController(contactsService, importService),
  };
}
