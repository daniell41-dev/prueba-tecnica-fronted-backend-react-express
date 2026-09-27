import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toErrorMessage } from '../utils/errors.js';
import { useAuth } from './useAuth.js';

export function useLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleChange(field: 'email' | 'password', value: string): void {
    if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return { email, password, isSubmitting, errorMessage, handleChange, handleSubmit };
}
