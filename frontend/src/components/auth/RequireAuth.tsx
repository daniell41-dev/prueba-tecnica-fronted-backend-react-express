import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';
import { Spinner } from '../ui/Spinner.js';

/** Guarda de ruta: sin sesión, manda a `/login`; mientras se confirma el token guardado, muestra un spinner. */
export function RequireAuth() {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return <Spinner label="Comprobando la sesión…" />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
