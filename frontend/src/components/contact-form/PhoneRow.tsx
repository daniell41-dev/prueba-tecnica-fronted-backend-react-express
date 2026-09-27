import { FieldError } from '../ui/FieldError.js';
import { getPhoneFieldError } from '../../utils/form-errors.js';
import type { PhoneRowProps } from '../../types/props.js';

const PHONE_TYPE_OPTIONS = [
  { value: 'mobile', label: 'Móvil' },
  { value: 'home', label: 'Casa' },
  { value: 'work', label: 'Trabajo' },
  { value: 'other', label: 'Otro' },
] as const;

export function PhoneRow({ phone, index, errors, handlers }: PhoneRowProps) {
  return (
    <div className="phone-row">
      <select value={phone.type} onChange={(event) => handlers.onChange(phone.id, 'type', event.target.value)}>
        {PHONE_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="phone-row__number">
        <input
          type="tel"
          placeholder="55 1234 5678"
          value={phone.number}
          onChange={(event) => handlers.onChange(phone.id, 'number', event.target.value)}
        />
        <FieldError message={getPhoneFieldError(errors, index, 'number')} />
      </div>
      <button type="button" onClick={() => handlers.onRemove(phone.id)} aria-label="Quitar teléfono">
        ✕
      </button>
    </div>
  );
}
