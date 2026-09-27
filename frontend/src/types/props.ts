import type { ReactNode } from 'react';
import type { AuthUser } from './auth.js';
import type { ContactFormValues, PhoneFormValue } from './contact-form.js';
import type { ContactDto, ContactFilters, PaginationMeta } from './contact.js';
import type { FieldErrors } from './api.js';

/**
 * Todas las props de todos los componentes de `src/components/`, en un solo
 * lugar — ningún `.tsx` que renderiza declara su propio `interface`/`type`
 * (ver `.claude/skills/convenciones-codigo/SKILL.md`). Cada interface tiene
 * como máximo 7 miembros; `tests/structure.test.ts` lo verifica.
 */

export interface AuthProviderProps {
  children: ReactNode;
}

// ---- auth ----

export interface LoginFormProps {
  email: string;
  password: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  onChange: (field: 'email' | 'password', value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

// ---- ui ----

export interface SpinnerProps {
  label?: string;
}

export interface EmptyStateProps {
  message: string;
}

export interface ErrorBannerProps {
  message: string;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export interface FavoriteFilterProps {
  value: ContactFilters['favorite'];
  onChange: (value: ContactFilters['favorite']) => void;
}

export interface SortSelectProps {
  sort: ContactFilters['sort'];
  order: ContactFilters['order'];
  onChange: (sort: ContactFilters['sort'], order: ContactFilters['order']) => void;
}

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export interface FieldErrorProps {
  message?: string;
}

export interface UserBadgeProps {
  user: AuthUser | null;
  onLogout: () => void;
}

// ---- contactos: toolbar ----

export interface ContactsToolbarProps {
  filters: ContactFilters;
  onFilterChange: (patch: Partial<Omit<ContactFilters, 'page'>>) => void;
  onImport: () => void;
  onCreate: () => void;
  isImporting: boolean;
}

// ---- contactos: lista ----

export interface ContactListProps {
  contacts: ContactDto[];
  onToggleFavorite: (contact: ContactDto) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface ContactRowProps {
  contact: ContactDto;
  onToggleFavorite: (contact: ContactDto) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface ContactListSectionProps {
  contacts: ContactDto[];
  isLoading: boolean;
  onToggleFavorite: (contact: ContactDto) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface FavoriteToggleProps {
  isFavorite: boolean;
  onToggle: () => void;
}

export interface PhoneListProps {
  phones: ContactDto['phones'];
}

// ---- formulario de contacto ----

export interface ContactFieldsProps {
  values: ContactFormValues;
  errors: FieldErrors;
  onChange: (field: keyof ContactFormValues, value: string | boolean) => void;
}

export interface PhoneHandlers {
  onChange: (id: string, field: 'type' | 'number', value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export interface PhoneFieldsProps {
  phones: PhoneFormValue[];
  errors: FieldErrors;
  handlers: PhoneHandlers;
}

export interface PhoneRowProps {
  phone: PhoneFormValue;
  index: number;
  errors: FieldErrors;
  handlers: PhoneHandlers;
}

export interface ContactFormFieldsProps {
  values: ContactFormValues;
  errors: FieldErrors;
  onFieldChange: (field: keyof ContactFormValues, value: string | boolean) => void;
  phoneHandlers: PhoneHandlers;
  onSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
  isEditing: boolean;
}
