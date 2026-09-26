import { EmptyState } from '../ui/EmptyState.js';
import { Spinner } from '../ui/Spinner.js';
import type { ContactListSectionProps } from '../../types/props.js';
import { ContactList } from './ContactList.js';

/** Decide sola entre spinner / vacío / lista — así `ContactsPage` no necesita un ternario para esto. */
export function ContactListSection({ contacts, isLoading, onToggleFavorite, onEdit, onDelete }: ContactListSectionProps) {
  if (isLoading) {
    return <Spinner label="Cargando contactos…" />;
  }
  if (contacts.length === 0) {
    return <EmptyState message="No hay contactos que coincidan con el filtro." />;
  }
  return <ContactList contacts={contacts} onToggleFavorite={onToggleFavorite} onEdit={onEdit} onDelete={onDelete} />;
}
