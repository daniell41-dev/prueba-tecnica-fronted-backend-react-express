import type { Pool } from 'pg';
import type { User } from '../domain/user.js';
import type { UserRepository } from './user.repository.js';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

function hydrateUser(row: UserRow): User {
  return { id: row.id, email: row.email, passwordHash: row.password_hash, createdAt: row.created_at };
}

export class PgUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    const row = result.rows[0];
    return row ? hydrateUser(row) : null;
  }
}
