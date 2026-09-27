---
name: convenciones-codigo
description: Reglas de estructura y estilo de código de este repo (backend y frontend) — cuándo cargarla: SIEMPRE antes de escribir, editar o revisar un archivo .ts/.tsx/.js/.jsx en backend/ o frontend/. Cubre el límite de 300 líneas por archivo, separar lógica en utils/hooks, el máximo de 7 props por componente, evitar ternarios anidados y no meter interface/type dentro de un archivo que renderiza.
---

# Convenciones de código de `contacts-app`

Estas reglas aplican a **todo** el código nuevo o modificado en `backend/` y
`frontend/`. No son sugerencias: varias están reforzadas por ESLint y por
`scripts/check-file-length.mjs`, así que romperlas hace fallar `pnpm lint`.
Léelas antes de escribir o tocar un archivo `.ts`/`.tsx`.

## 1. Ningún archivo pasa de 300 líneas

Contando código real (ESLint `max-lines` descuenta líneas en blanco y
comentarios; `check-file-length.mjs` no, para `.sql`/`.css`).

Cuando un archivo se acerca al límite, se parte así:

- **Backend**: un controller/service/repository que crece se separa por
  responsabilidad. Ejemplo: si `contacts.controller.ts` se pasa, la lógica de
  armar la respuesta paginada sale a un helper en `utils/`, no a un archivo
  `contacts.controller.2.ts`.
- **Frontend**: una page o componente que crece **siempre** se parte
  extrayendo un componente hijo o un hook, nunca alargando el archivo.
- **Tests**: se parten por endpoint o por caso de uso
  (`contacts.list.api.test.ts`, `contacts.create.api.test.ts`, en vez de un
  `contacts.api.test.ts` gigante).

Antes de un commit grande: `node scripts/check-file-length.mjs` y
`pnpm lint` (ambos paquetes).

## 2. Frontend: las pages solo renderizan

Una page (`src/pages/*.tsx`) es una función que:

1. Llama a uno o más hooks (`useContacts()`, `useContactForm()`…) para
   obtener estado y handlers.
2. Devuelve JSX que compone componentes de `src/components/`.

Lo que **no** va en una page: `useState`, `useEffect`, `fetch`/llamadas a
`src/api/`, cálculos de formato o validación inline. Todo eso vive en:

- `src/hooks/` — estado, efectos, y los handlers que se le pasan a los
  componentes.
- `src/utils/` — funciones puras reutilizables (formatear una fecha, mapear
  errores de Zod a un formulario, normalizar un teléfono).

```tsx
// ✅ src/pages/ContactsPage.tsx
export function ContactsPage() {
  const { contacts, meta, filters, setFilters, isLoading } = useContacts();
  return (
    <ContactsLayout>
      <SearchBar value={filters.search} onChange={setFilters} />
      <ContactList contacts={contacts} isLoading={isLoading} />
      <Pagination meta={meta} onPageChange={setFilters} />
    </ContactsLayout>
  );
}

// ❌ nunca esto en una page
export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  useEffect(() => {
    fetch('/api/contacts').then(/* ... */); // ← esto va en un hook
  }, []);
  // ...
}
```

## 3. Máximo 7 props por componente

Si un componente necesita más, agrupa en un objeto (`filters: ContactFilters`
en vez de `search, favorite, sortBy, order` sueltos) o pártelo en
subcomponentes. La interface de props vive en `src/types/props.ts`, nunca en
el archivo del componente (ver regla 5).

## 4. No abusar de los ternarios

Nunca un ternario anidado (`a ? b : c ? d : e`). Para renderizar según una
condición, en este orden de preferencia:

1. Early return dentro del componente/función.
2. `condicion && <Componente />` para "esto o nada".
3. Un objeto de mapeo (`STATUS_LABEL[status]`) cuando hay 3+ casos.
4. Extraer un subcomponente que decida internamente.

```tsx
// ❌
return isLoading ? <Spinner /> : hasError ? <ErrorState /> : <ContactList />;

// ✅
if (isLoading) return <Spinner />;
if (hasError) return <ErrorState />;
return <ContactList />;
```

## 5. `interface`/`type` nunca dentro de un archivo que renderiza

Ningún `.tsx` que exporte un componente declara `interface`/`type` en el
mismo archivo. Van en `src/types/` (o junto al schema de Zod con `z.infer`
en el backend) y se importan con `import type`.

```tsx
// ❌ dentro de ContactRow.tsx
interface ContactRowProps { contact: Contact; onDelete: (id: string) => void; }

// ✅ src/types/props.ts
export interface ContactRowProps { contact: Contact; onDelete: (id: string) => void; }

// ✅ ContactRow.tsx
import type { ContactRowProps } from '../types/props';
```

## Checklist antes de commitear

- [ ] `pnpm lint` en verde (backend y frontend).
- [ ] `node scripts/check-file-length.mjs` en verde.
- [ ] Ninguna page nueva usa `useState`/`useEffect`/`fetch` directamente.
- [ ] Ningún componente nuevo recibe más de 7 props.
- [ ] Ningún `.tsx` nuevo declara `interface`/`type` propio.
- [ ] Sin ternarios anidados.
