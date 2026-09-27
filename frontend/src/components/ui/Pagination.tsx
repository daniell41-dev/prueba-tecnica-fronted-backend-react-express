import type { PaginationProps } from '../../types/props.js';

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const isFirstPage = meta.page <= 1;
  const isLastPage = meta.page >= meta.total_pages;

  return (
    <nav className="pagination" aria-label="Paginación de contactos">
      <button type="button" disabled={isFirstPage} onClick={() => onPageChange(meta.page - 1)}>
        ← Anterior
      </button>
      <span className="pagination__status">
        Página {meta.page} de {meta.total_pages} · {meta.total} contacto{meta.total === 1 ? '' : 's'}
      </span>
      <button type="button" disabled={isLastPage} onClick={() => onPageChange(meta.page + 1)}>
        Siguiente →
      </button>
    </nav>
  );
}
