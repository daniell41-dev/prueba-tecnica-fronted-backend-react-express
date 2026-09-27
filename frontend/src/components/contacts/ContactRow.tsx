import type { ContactRowProps } from '../../types/props.js';
import { FavoriteToggle } from './FavoriteToggle.js';
import { PhoneList } from './PhoneList.js';

export function ContactRow({ contact, onToggleFavorite, onEdit, onDelete }: ContactRowProps) {
  return (
    <li className="contact-row">
      <FavoriteToggle isFavorite={contact.favorite} onToggle={() => onToggleFavorite(contact)} />
      <div className="contact-row__info">
        <p className="contact-row__name">
          {contact.first_name} {contact.last_name}
        </p>
        <p className="contact-row__email">{contact.email}</p>
        {contact.company && <p className="contact-row__company">{contact.company}</p>}
        <PhoneList phones={contact.phones} />
      </div>
      <div className="contact-row__actions">
        <button type="button" onClick={() => onEdit(contact.id)}>
          Editar
        </button>
        <button type="button" onClick={() => onDelete(contact.id)}>
          Borrar
        </button>
      </div>
    </li>
  );
}
