import type { Request, Response } from 'express';
import type { LoginBody } from '../schemas/auth.schema.js';
import type { AuthService } from '../services/auth.service.js';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as LoginBody;
    res.json(await this.service.login(email, password));
  };

  /** `GET /api/auth/me` — confirma que el token es válido y muestra a quién pertenece. */
  me = (req: Request, res: Response): void => {
    res.json({ user: req.user });
  };
}
