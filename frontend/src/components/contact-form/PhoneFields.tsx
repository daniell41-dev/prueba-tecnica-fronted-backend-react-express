import type { PhoneFieldsProps } from '../../types/props.js';
import { PhoneRow } from './PhoneRow.js';

export function PhoneFields({ phones, errors, handlers }: PhoneFieldsProps) {
  return (
    <fieldset className="phone-fields">
      <legend>Teléfonos</legend>
      {phones.map((phone, index) => (
        <PhoneRow key={phone.id} phone={phone} index={index} errors={errors} handlers={handlers} />
      ))}
      <button type="button" onClick={handlers.onAdd}>
        + Agregar teléfono
      </button>
    </fieldset>
  );
}
