import type { SearchBarProps } from '../../types/props.js';

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="search"
      className="search-bar"
      placeholder="Buscar por nombre, email o empresa…"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Buscar contactos"
    />
  );
}
