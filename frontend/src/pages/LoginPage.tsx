import { LoginForm } from '../components/auth/LoginForm.js';
import { useLogin } from '../hooks/useLogin.js';

export function LoginPage() {
  const { email, password, isSubmitting, errorMessage, handleChange, handleSubmit } = useLogin();

  return (
    <main className="auth-page">
      <LoginForm
        email={email}
        password={password}
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
