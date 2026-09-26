import type { FavoriteToggleProps } from '../../types/props.js';

export function FavoriteToggle({ isFavorite, onToggle }: FavoriteToggleProps) {
  return (
    <button
      type="button"
      className="favorite-toggle"
      onClick={onToggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
    >
      {isFavorite ? '★' : '☆'}
    </button>
  );
}
