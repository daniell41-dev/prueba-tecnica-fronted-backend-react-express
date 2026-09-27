import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import type { RandomUserClient } from '../../src/clients/random-user.client.js';
import { env } from '../../src/config/env.js';
import { AuthController } from '../../src/controllers/auth.controller.js';
import { ContactsController } from '../../src/controllers/contacts.controller.js';
import { HealthController } from '../../src/controllers/health.controller.js';
import { createApp } from '../../src/app.js';
import type { User } from '../../src/domain/user.js';
import type { ContactRepository } from '../../src/repositories/contact.repository.js';
import { AuthService } from '../../src/services/auth.service.js';
import { ContactImportService } from '../../src/services/contact-import.service.js';
import { ContactsService } from '../../src/services/contacts.service.js';
import { FakeRandomUserClient } from './fake-random-user.client.js';
import { InMemoryContactRepository } from './in-memory-contact.repository.js';
import { InMemoryUserRepository } from './in-memory-user.repository.js';

export const TEST_USER_EMAIL = 'demo@example.com';
export const TEST_USER_PASSWORD = 'Demo1234!';

export interface TestAppOptions {
  contactRepository?: ContactRepository;
  randomUserClient?: RandomUserClient;
}

export interface TestApp {
  app: Express;
  contactRepository: ContactRepository;
  /** Token JWT ya firmado para `TEST_USER_EMAIL`, listo para `Authorization: Bearer`. */
  authToken: string;
}

async function buildTestUser(): Promise<User> {
  return {
    id: randomUUID(),
    email: TEST_USER_EMAIL,
    // Costo bajo (4): esto corre en cada test, no hace falta el costo de producción.
    passwordHash: await bcrypt.hash(TEST_USER_PASSWORD, 4),
    createdAt: new Date(),
  };
}

/**
 * Arma una app completa (Kernel → rutas → controllers → services →
 * repositorio) igual que `container.ts`, pero 100% en memoria — es el
 * equivalente Node del `ContactApiTest::setUp()` de la versión PHP. La usan
 * todos los tests de `tests/api/`.
 */
export async function buildTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  const contactRepository = options.contactRepository ?? new InMemoryContactRepository();
  const randomUserClient = options.randomUserClient ?? new FakeRandomUserClient();
  const user = await buildTestUser();
  const userRepository = new InMemoryUserRepository([user]);

  const contactsService = new ContactsService(contactRepository);
  const authService = new AuthService(userRepository);
  const importService = new ContactImportService(contactRepository, randomUserClient);

  const app = createApp({
    healthController: new HealthController({ ping: async () => Promise.resolve() }),
    authController: new AuthController(authService),
    contactsController: new ContactsController(contactsService, importService),
  });

  const authToken = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '1h' });

  return { app, contactRepository, authToken };
}
