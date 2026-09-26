import { useNavigate } from 'react-router';
import { ContactListSection } from '../components/contacts/ContactListSection.js';
import { ContactsToolbar } from '../components/contacts/ContactsToolbar.js';
import { ErrorBanner } from '../components/ui/ErrorBanner.js';
import { Pagination } from '../components/ui/Pagination.js';
import { UserBadge } from '../components/ui/UserBadge.js';
import { useAuth } from '../hooks/useAuth.js';
import { useContacts } from '../hooks/useContacts.js';

const IMPORT_COUNT = 5;

/** Solo renderiza: toda la lógica de filtros/paginación/acciones vive en `useContacts`. */
export function ContactsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    contacts,
    meta,
    isLoading,
    error,
    isImporting,
    filters,
    setPage,
    setFilter,
    toggleFavorite,
    removeContact,
    runImport,
  } = useContacts();

  return (
    <main className="contacts-page">
      <header className="contacts-page__header">
        <h1>Agenda de contactos</h1>
        <UserBadge user={user} onLogout={logout} />
      </header>

      <ContactsToolbar
        filters={filters}
        onFilterChange={setFilter}
        onImport={() => runImport(IMPORT_COUNT)}
        onCreate={() => navigate('/contacts/new')}
        isImporting={isImporting}
      />

      {error && <ErrorBanner message={error} />}

      <ContactListSection
        contacts={contacts}
        isLoading={isLoading}
        onToggleFavorite={toggleFavorite}
        onEdit={(id) => navigate(`/contacts/${id}/edit`)}
        onDelete={removeContact}
      />

      <Pagination meta={meta} onPageChange={setPage} />
    </main>
  );
}
