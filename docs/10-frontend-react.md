# 10 - FRONTEND REACT

El foco de este repo es el backend, pero el frontend es un cliente completo
de la API — útil si la entrevista también toca algo de React, o
simplemente para ver la app funcionando de punta a punta.

## Estructura

```
frontend/src/
├── main.tsx, App.tsx           # arranque + solo el mapa de rutas
├── pages/                       # SOLO renderizan: llaman un hook, componen componentes
│   ├── LoginPage.tsx
│   ├── ContactsPage.tsx
│   └── ContactFormPage.tsx      # sirve para crear y editar (useContactForm decide cuál)
├── components/
│   ├── auth/                    # LoginForm, RequireAuth (guarda de ruta)
│   ├── contacts/                 # ContactList, ContactRow, FavoriteToggle, ContactsToolbar...
│   ├── contact-form/              # ContactFormFields, PhoneFields, PhoneRow
│   └── ui/                        # Pagination, SearchBar, Spinner, EmptyState, FieldError...
├── hooks/                        # TODO el estado y los efectos viven aquí
│   ├── useAuth.ts, useAuthState.ts
│   ├── useContacts.ts            # filtros + paginación + acciones (favorito, borrar, importar)
│   ├── useContactForm.ts         # estado del formulario de crear/editar
│   └── useDebouncedValue.ts
├── context/                      # AuthProvider (solo renderiza) + auth-context.ts
├── api/                           # http.ts (fetch wrapper), contacts.api.ts, auth.api.ts
├── utils/                         # funciones puras: contact-form, form-errors, format, errors
└── types/                         # TODOS los interface/type del proyecto (incluidas las props)
```

## La convención más importante: las `pages/` solo renderizan

```tsx
// ✅ src/pages/ContactsPage.tsx — solo llama al hook y compone componentes
export function ContactsPage() {
  const { contacts, meta, filters, setPage, setFilter, isLoading, error, ... } = useContacts();
  return (
    <main>
      <ContactsToolbar filters={filters} onFilterChange={setFilter} ... />
      <ContactListSection contacts={contacts} isLoading={isLoading} ... />
      <Pagination meta={meta} onPageChange={setPage} />
    </main>
  );
}
```

Ninguna page tiene `useState`, `useEffect` ni llama a `fetch` directamente
— `tests/structure.test.ts` lo verifica escaneando el código fuente. Toda
esa lógica vive en un hook (`useContacts`, `useContactForm`, `useLogin`).
La ventaja práctica: puedes probar `useContacts` con datos falsos sin
montar ni un componente, y la page en sí es tan simple que casi no necesita
test propio.

## El wrapper de `fetch` (`api/http.ts`)

```ts
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`/api${path}`, { ...options, headers });
  const body = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, body.message, body.errors);
  }
  return body as T;
}
```

Centraliza tres cosas que si no, se repetirían en cada llamada: agregar el
token si existe, parsear JSON (o `null` en un `204`), y convertir cualquier
respuesta no-2xx en una excepción (`ApiError`) con el `status` y los
`fieldErrors` del 422 — así un formulario solo necesita
`catch (error) { if (error instanceof ApiError) setErrors(error.fieldErrors) }`.

## El contexto de autenticación

`AuthProvider.tsx` **no** tiene lógica propia — solo llama a `useAuthState()`
y renderiza el `Provider`:

```tsx
export function AuthProvider({ children }: AuthProviderProps) {
  const value = useAuthState();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

`useAuthState` (el hook) es quien, al montar, si hay un token guardado en
`localStorage`, lo confirma contra `GET /api/auth/me` antes de considerar
la sesión válida — un token viejo o corrupto no deja la app en un estado
"medio autenticado". `RequireAuth` (guarda de ruta) lee `isAuthenticated`/
`isReady` de ese contexto y decide: mientras confirma, muestra un spinner;
si no hay sesión, `<Navigate to="/login" />`; si la hay, `<Outlet />`.

## El proxy: Vite en dev, nginx en producción

- **Dev** (`vite.config.ts`): `server.proxy['/api']` manda cualquier
  `fetch('/api/...')` a `http://localhost:3000`.
- **Producción** (`nginx.conf`, dentro de Docker): `location /api/ { proxy_pass
  http://api:3000; }` hace lo mismo, pero resolviendo `api` por el DNS
  interno de Docker (ver `docs/07-docker-desktop.md`).

En ambos casos, el código de React **nunca** conoce el host real de la
API — siempre pide rutas relativas (`/api/contacts`). Eso es lo que permite
que el mismo build funcione igual en dev y en Docker sin configuración
condicional.

## Otras convenciones que vale la pena notar

- **Máximo 7 props por componente** — cuando un componente necesitaría más,
  se agrupan en un objeto (`phoneHandlers: { onChange, onAdd, onRemove }`
  en vez de tres props sueltas). `tests/structure.test.ts` también lo
  verifica, contando los miembros de cada interface en `types/props.ts`.
- **Ningún ternario anidado** — para decidir entre spinner / vacío / lista
  (`ContactListSection`) se usa un early return por caso, no
  `isLoading ? <Spinner/> : contacts.length === 0 ? <Empty/> : <List/>`.
- **Ningún `interface`/`type` dentro de un `.tsx`** — todos viven en
  `src/types/` y se importan con `import type`. Un ESLint
  `no-restricted-syntax` lo hace cumplir sobre `**/*.tsx`.
