import type { AuthUser, LoginResponse } from '../types/auth.js';
import { apiFetch } from './http.js';

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function me(): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>('/auth/me');
}
