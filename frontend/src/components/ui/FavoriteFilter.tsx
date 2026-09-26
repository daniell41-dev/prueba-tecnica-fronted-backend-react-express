import type { ContactFilters } from '../../types/contact.js';
import type { FavoriteFilterProps } from '../../types/props.js';

function toFilterValue(raw: string): ContactFilters['favorite'] {
  return raw === 'true' || raw === 'false' ? raw : undefined;
}

export function FavoriteFilter({ value, onChange }: FavoriteFilterProps) {
  return (
    <select
      className="favorite-filter"
      value={value ?? ''}
      onChange={(event) => onChange(toFilterValue(event.target.value))}
      aria-label="Filtrar por favoritos"
    >
      <option value="">Todos</option>
      <option value="true">Solo favoritos</option>
      <option value="false">Sin favoritos</option>
    </select>
  );
}
