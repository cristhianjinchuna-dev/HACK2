import { api } from '../api';
import type { LoginResponse, MeResponse } from '../types';

// Solo lógica de consultas: los componentes no escriben URLs
export const authService = {
  register: (body: { teamName: string; email: string; password: string }) =>
    api.post<LoginResponse>('/auth/register', body).then((res) => res.data),

  login: (body: { email: string; password: string }) =>
    api.post<LoginResponse>('/auth/login', body).then((res) => res.data),

  me: (signal?: AbortSignal) => api.get<MeResponse>('/auth/me', { signal }).then((res) => res.data),
};