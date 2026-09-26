import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from '../../src/components/ui/Pagination.js';

describe('<Pagination />', () => {
  it('muestra la página actual, el total de páginas y el total de contactos', () => {
    render(<Pagination meta={{ page: 2, limit: 10, total: 25, total_pages: 3 }} onPageChange={vi.fn()} />);
    expect(screen.getByText(/página 2 de 3/i)).toBeInTheDocument();
    expect(screen.getByText(/25 contactos/i)).toBeInTheDocument();
  });

  it('deshabilita "Anterior" en la primera página y "Siguiente" en la última', () => {
    render(<Pagination meta={{ page: 1, limit: 10, total: 5, total_pages: 1 }} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled();
  });

  it('llama a onPageChange con page + 1 al hacer clic en "Siguiente"', async () => {
    const onPageChange = vi.fn();
    render(<Pagination meta={{ page: 1, limit: 10, total: 25, total_pages: 3 }} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('llama a onPageChange con page - 1 al hacer clic en "Anterior"', async () => {
    const onPageChange = vi.fn();
    render(<Pagination meta={{ page: 2, limit: 10, total: 25, total_pages: 3 }} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole('button', { name: /anterior/i }));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
