import type { ContactFilters } from '../../types/contact.js';
import type { SortSelectProps } from '../../types/props.js';

const SORT_OPTIONS: Array<{ value: ContactFilters['sort']; label: string }> = [
  { value: 'first_name', label: 'Nombre' },
  { value: 'last_name', label: 'Apellido' },
  { value: 'created_at', label: 'Más recientes' },
];

export function SortSelect({ sort, order, onChange }: SortSelectProps) {
  return (
    <div className="sort-select">
      <select
        value={sort}
        aria-label="Ordenar por"
        onChange={(event) => onChange(event.target.value as ContactFilters['sort'], order)}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="sort-select__direction"
        onClick={() => onChange(sort, order === 'asc' ? 'desc' : 'asc')}
        aria-label={order === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
      >
        {order === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  );
}
