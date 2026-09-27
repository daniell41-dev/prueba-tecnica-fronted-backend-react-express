import { useCallback, useEffect, useState } from 'react';
import { login as loginRequest, me as meRequest } from '../api/auth.api.js';
import { clearStoredToken, getStoredToken, setStoredToken } from '../api/http.js';
import type { AuthContextValue, AuthUser } from '../types/auth.js';

/**
 * El estado real detrás de `AuthContext` — `AuthProvider.tsx` solo llama a
 * este hook y renderiza el `Provider`, sin lógica propia (ver
 * `.claude/skills/convenciones-codigo/SKILL.md`: la lógica vive en hooks).
 *
 * Al montar, si hay un token guardado se confirma contra
 * `GET /api/auth/me` — un token viejo/inválido en `localStorage` no debe
 * dejar a la app "medio autenticada".
 */
export function useAuthState(): AuthContextValue {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setIsReady(true);
      return;
    }

    setToken(storedToken);
    meRequest()
      .then((response) => setUser(response.user))
      .catch(() => {
        clearStoredToken();
        setToken(null);
      })
      .finally(() => setIsReady(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  return { token, user, isAuthenticated: token !== null, isReady, login, logout };
}
