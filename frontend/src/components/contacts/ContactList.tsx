import type { ContactListProps } from '../../types/props.js';
import { ContactRow } from './ContactRow.js';

export function ContactList({ contacts, onToggleFavorite, onEdit, onDelete }: ContactListProps) {
  return (
    <ul className="contact-list">
      {contacts.map((contact) => (
        <ContactRow key={contact.id} contact={contact} onToggleFavorite={onToggleFavorite} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}
