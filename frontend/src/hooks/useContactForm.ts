import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { createContact, getContact, replaceContact } from '../api/contacts.api.js';
import { ApiError } from '../api/http.js';
import type { FieldErrors } from '../types/api.js';
import type { ContactFormValues } from '../types/contact-form.js';
import { contactToFormValues, createEmptyFormValues, createEmptyPhone, formValuesToPayload } from '../utils/contact-form.js';
import { toErrorMessage } from '../utils/errors.js';

/** Estado del formulario de crear/editar contacto — la misma page sirve para las dos rutas. */
export function useContactForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [values, setValues] = useState<ContactFormValues>(createEmptyFormValues());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    let isMounted = true;

    getContact(id)
      .then((response) => {
        if (isMounted) {
          setValues(contactToFormValues(response.contact));
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setLoadError(toErrorMessage(error));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  function handleFieldChange(field: keyof ContactFormValues, value: string | boolean): void {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  function handlePhoneChange(phoneId: string, field: 'type' | 'number', value: string): void {
    setValues((previous) => ({
      ...previous,
      phones: previous.phones.map((phone) => (phone.id === phoneId ? { ...phone, [field]: value } : phone)),
    }));
  }

  function addPhone(): void {
    setValues((previous) => ({ ...previous, phones: [...previous.phones, createEmptyPhone()] }));
  }

  function removePhone(phoneId: string): void {
    setValues((previous) => ({ ...previous, phones: previous.phones.filter((phone) => phone.id !== phoneId) }));
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const payload = formValuesToPayload(values);
      if (id) {
        await replaceContact(id, payload);
      } else {
        await createContact(payload);
      }
      navigate('/', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        setErrors(error.fieldErrors);
      } else {
        setErrors({ _root: [toErrorMessage(error)] });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    values,
    errors,
    isEditing,
    isLoading,
    isSubmitting,
    loadError,
    handleFieldChange,
    handlePhoneChange,
    addPhone,
    removePhone,
    handleSubmit,
  };
}
