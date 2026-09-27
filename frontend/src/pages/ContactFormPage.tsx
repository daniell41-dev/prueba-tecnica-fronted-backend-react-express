import { Link } from 'react-router';
import { ContactFormFields } from '../components/contact-form/ContactFormFields.js';
import { ErrorBanner } from '../components/ui/ErrorBanner.js';
import { Spinner } from '../components/ui/Spinner.js';
import { useContactForm } from '../hooks/useContactForm.js';

/** Sirve tanto para crear (`/contacts/new`) como para editar (`/contacts/:id/edit`) — `useContactForm` decide cuál según la ruta. */
export function ContactFormPage() {
  const {
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
  } = useContactForm();

  return (
    <main className="contact-form-page">
      <Link to="/" className="contact-form-page__back">
        ← Volver a la lista
      </Link>
      <h1>{isEditing ? 'Editar contacto' : 'Nuevo contacto'}</h1>

      {isLoading && <Spinner label="Cargando contacto…" />}
      {loadError && <ErrorBanner message={loadError} />}

      {!isLoading && !loadError && (
        <ContactFormFields
          values={values}
          errors={errors}
          onFieldChange={handleFieldChange}
          phoneHandlers={{ onChange: handlePhoneChange, onAdd: addPhone, onRemove: removePhone }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isEditing={isEditing}
        />
      )}
    </main>
  );
}
