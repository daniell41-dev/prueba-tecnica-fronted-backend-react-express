import type { Request, Response } from 'express';

/** Última pieza de la cadena de middlewares: ninguna ruta anterior respondió. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'La ruta solicitada no existe.' });
}
