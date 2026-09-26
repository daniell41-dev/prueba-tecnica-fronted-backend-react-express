import type { PhoneType } from './contact.js';

/** `id` es un identificador local (para el `key` de React y para poder quitar la fila) — no es el id que asigna el servidor. */
export interface PhoneFormValue {
  id: string;
  type: PhoneType;
  number: string;
}

export interface ContactFormValues {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  favorite: boolean;
  phones: PhoneFormValue[];
}
