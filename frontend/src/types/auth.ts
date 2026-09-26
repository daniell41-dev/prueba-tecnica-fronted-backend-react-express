export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

/** Lo que expone `AuthContext` — lo consume `useAuth()`. */
export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
