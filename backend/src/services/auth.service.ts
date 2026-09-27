import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';
import type { UserRepository } from '../repositories/user.repository.js';

export interface LoginResult {
  token: string;
  user: { id: string; email: string };
}

/**
 * Login con email + contraseña. El mensaje de error es el mismo tanto si el
 * email no existe como si la contraseña no coincide — no le decimos a quien
 * ataca cuál de las dos cosas falló ("no filtrar si el usuario existe").
 */
export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !isValid) {
      throw new UnauthorizedError('Credenciales inválidas.');
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    return { token, user: { id: user.id, email: user.email } };
  }
}
