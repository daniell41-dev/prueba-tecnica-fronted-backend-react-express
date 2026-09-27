/** Usuario de autenticación. Solo existe para proteger los endpoints de escritura de contactos. */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}
