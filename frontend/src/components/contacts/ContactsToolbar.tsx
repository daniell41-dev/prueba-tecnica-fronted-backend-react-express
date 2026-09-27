import { FavoriteFilter } from '../ui/FavoriteFilter.js';
import { SearchBar } from '../ui/SearchBar.js';
import { SortSelect } from '../ui/SortSelect.js';
import type { ContactsToolbarProps } from '../../types/props.js';

const IMPORT_COUNT = 5;

export function ContactsToolbar({ filters, onFilterChange, onImport, onCreate, isImporting }: ContactsToolbarProps) {
  return (
    <div className="contacts-toolbar">
      <SearchBar value={filters.search ?? ''} onChange={(search) => onFilterChange({ search })} />
      <FavoriteFilter value={filters.favorite} onChange={(favorite) => onFilterChange({ favorite })} />
      <SortSelect sort={filters.sort} order={filters.order} onChange={(sort, order) => onFilterChange({ sort, order })} />
      <button type="button" onClick={onImport} disabled={isImporting}>
        {isImporting ? 'Importando…' : `Importar ${IMPORT_COUNT}`}
      </button>
      <button type="button" className="contacts-toolbar__create" onClick={onCreate}>
        + Nuevo contacto
      </button>
    </div>
  );
}
