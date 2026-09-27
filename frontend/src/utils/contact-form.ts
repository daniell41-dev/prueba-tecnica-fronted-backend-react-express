import type { ContactFormValues, PhoneFormValue } from '../types/contact-form.js';
import type { ContactDto, ContactPayload } from '../types/contact.js';

export function createEmptyPhone(): PhoneFormValue {
  return { id: crypto.randomUUID(), type: 'mobile', number: '' };
}

export function createEmptyFormValues(): ContactFormValues {
  return { first_name: '', last_name: '', email: '', company: '', favorite: false, phones: [] };
}

/** El formulario de edición se precarga con el contacto ya guardado. */
export function contactToFormValues(contact: ContactDto): ContactFormValues {
  return {
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    company: contact.company ?? '',
    favorite: contact.favorite,
    phones: contact.phones.map((phone) => ({ id: crypto.randomUUID(), type: phone.type, number: phone.number })),
  };
}

/** Evita un ternario anidado en `ContactFormFields` ("guardando" / "editar" / "crear"). */
export function getSubmitLabel(isSubmitting: boolean, isEditing: boolean): string {
  if (isSubmitting) {
    return 'Guardando…';
  }
  return isEditing ? 'Guardar cambios' : 'Crear contacto';
}

/** Filas de teléfono que el usuario dejó en blanco no se mandan — no tiene sentido validarlas como error. */
export function formValuesToPayload(values: ContactFormValues): ContactPayload {
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    email: values.email.trim(),
    company: values.company.trim() === '' ? null : values.company.trim(),
    favorite: values.favorite,
    phones: values.phones
      .filter((phone) => phone.number.trim() !== '')
      .map((phone) => ({ type: phone.type, number: phone.number.trim() })),
  };
}
