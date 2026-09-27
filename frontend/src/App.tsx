import { Navigate, Route, Routes } from 'react-router';
import { RequireAuth } from './components/auth/RequireAuth.js';
import { ContactFormPage } from './pages/ContactFormPage.js';
import { ContactsPage } from './pages/ContactsPage.js';
import { LoginPage } from './pages/LoginPage.js';

/** Solo el mapa ruta → page — nada de lógica ni de datos aquí. */
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<ContactsPage />} />
        <Route path="/contacts/new" element={<ContactFormPage />} />
        <Route path="/contacts/:id/edit" element={<ContactFormPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
