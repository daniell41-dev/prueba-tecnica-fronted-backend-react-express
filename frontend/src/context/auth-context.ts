import { createContext } from 'react';
import type { AuthContextValue } from '../types/auth.js';

/** `null` fuera de `<AuthProvider>` — `useAuth()` es quien revienta con un mensaje claro si pasa eso. */
export const AuthContext = createContext<AuthContextValue | null>(null);
