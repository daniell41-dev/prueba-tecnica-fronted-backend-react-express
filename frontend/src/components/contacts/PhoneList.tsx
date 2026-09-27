import { formatPhoneNumber, formatPhoneType } from '../../utils/format.js';
import type { PhoneListProps } from '../../types/props.js';

export function PhoneList({ phones }: PhoneListProps) {
  if (phones.length === 0) {
    return <span className="phone-list phone-list--empty">Sin teléfono</span>;
  }
  return (
    <ul className="phone-list">
      {phones.map((phone) => (
        <li key={`${phone.type}-${phone.number}`}>
          <span className="phone-list__type">{formatPhoneType(phone.type)}</span> {formatPhoneNumber(phone.number)}
        </li>
      ))}
    </ul>
  );
}
