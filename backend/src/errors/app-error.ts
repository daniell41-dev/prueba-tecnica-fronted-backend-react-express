/**
 * Errores de negocio con un código HTTP asociado. `errorHandler` (el
 * equivalente de `Kernel::handle()` en la versión PHP) sabe traducir
 * cualquier subclase de `AppError` a la respuesta correcta sin que los
 * controllers/services conozcan Express.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }

  static forContact(id: string): NotFoundError {
    return new NotFoundError(`No existe un contacto con id "${id}".`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado.') {
    super(message, 401);
  }
}

/**
 * Falla al llamar a un servicio externo (`RandomUserClient`). `502` cuando el
 * servicio respondió mal o no se pudo contactar; `504` específicamente
 * cuando fue un timeout — así el cliente HTTP puede distinguir "el externo
 * está caído" de "el externo está lento".
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, statusCode: 502 | 504 = 502) {
    super(message, statusCode);
  }
}
