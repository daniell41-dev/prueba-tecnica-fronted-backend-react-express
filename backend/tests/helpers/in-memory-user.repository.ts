import type { User } from '../../src/domain/user.js';
import type { UserRepository } from '../../src/repositories/user.repository.js';

export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly users: User[] = []) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  }
}
