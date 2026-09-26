import { useContext } from 'react';
import { AuthContext } from '../context/auth-context.js';
import type { AuthContextValue } from '../types/auth.js';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return context;
}
