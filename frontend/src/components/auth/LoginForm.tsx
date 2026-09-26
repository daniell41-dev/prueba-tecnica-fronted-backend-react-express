import { ErrorBanner } from '../ui/ErrorBanner.js';
import type { LoginFormProps } from '../../types/props.js';

export function LoginForm({ email, password, errorMessage, isSubmitting, onChange, onSubmit }: LoginFormProps) {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      <h1>Agenda de contactos</h1>
      {errorMessage && <ErrorBanner message={errorMessage} />}

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => onChange('email', event.target.value)}
        required
      />

      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => onChange('password', event.target.value)}
        required
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </button>

      <p className="login-form__hint">Demo: demo@example.com / Demo1234!</p>
    </form>
  );
}
