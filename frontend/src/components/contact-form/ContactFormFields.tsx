import { FieldError } from '../ui/FieldError.js';
import { getFieldError } from '../../utils/form-errors.js';
import { getSubmitLabel } from '../../utils/contact-form.js';
import type { ContactFormFieldsProps } from '../../types/props.js';
import { PhoneFields } from './PhoneFields.js';

export function ContactFormFields({
  values,
  errors,
  onFieldChange,
  phoneHandlers,
  onSubmit,
  isSubmitting,
  isEditing,
}: ContactFormFieldsProps) {
  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <FieldError message={errors._root?.[0]} />

      <label htmlFor="first_name">Nombre</label>
      <input id="first_name" value={values.first_name} onChange={(event) => onFieldChange('first_name', event.target.value)} />
      <FieldError message={getFieldError(errors, 'first_name')} />

      <label htmlFor="last_name">Apellido</label>
      <input id="last_name" value={values.last_name} onChange={(event) => onFieldChange('last_name', event.target.value)} />
      <FieldError message={getFieldError(errors, 'last_name')} />

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={values.email}
        onChange={(event) => onFieldChange('email', event.target.value)}
      />
      <FieldError message={getFieldError(errors, 'email')} />

      <label htmlFor="company">Empresa</label>
      <input id="company" value={values.company} onChange={(event) => onFieldChange('company', event.target.value)} />
      <FieldError message={getFieldError(errors, 'company')} />

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={values.favorite}
          onChange={(event) => onFieldChange('favorite', event.target.checked)}
        />
        Favorito
      </label>

      <PhoneFields phones={values.phones} errors={errors} handlers={phoneHandlers} />

      <button type="submit" disabled={isSubmitting}>
        {getSubmitLabel(isSubmitting, isEditing)}
      </button>
    </form>
  );
}
