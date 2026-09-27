import { useAuthState } from '../hooks/useAuthState.js';
import type { AuthProviderProps } from '../types/props.js';
import { AuthContext } from './auth-context.js';

/** Solo renderiza: toda la lógica de autenticación vive en `useAuthState`. */
export function AuthProvider({ children }: AuthProviderProps) {
  const value = useAuthState();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
