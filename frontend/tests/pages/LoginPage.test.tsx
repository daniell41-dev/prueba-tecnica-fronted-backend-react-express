import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { login } from '../../src/api/auth.api.js';
import { AuthProvider } from '../../src/context/AuthProvider.js';
import { LoginPage } from '../../src/pages/LoginPage.js';

vi.mock('../../src/api/auth.api.js', () => ({
  login: vi.fn(),
  me: vi.fn(),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('<LoginPage />', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('muestra un banner de error si las credenciales son incorrectas', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Credenciales inválidas.'));
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'demo@example.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'incorrecta');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas.');
  });

  it('llama a login con el email y la contraseña del formulario', async () => {
    vi.mocked(login).mockResolvedValue({ token: 'abc', user: { id: '1', email: 'demo@example.com' } });
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'demo@example.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'Demo1234!');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('demo@example.com', 'Demo1234!'));
  });
});
