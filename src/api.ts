import axios from 'axios';
import type { ApiError, Page } from './types';

const TOKEN_KEY = 'token';

// Único lugar donde se guarda el JWT (sessionStorage, como indicaron)
export const tokenStorage = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

// Instancia única de axios: la URL viene del .env
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

// REQUEST interceptor: lee el JWT guardado y lo envía en cada petición
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// El AuthContext registra aquí su logout
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

// RESPONSE interceptor: si la sesión deja de ser válida (401), se cierra la sesión.
// En login/registro un 401 significa "datos incorrectos", no sesión vencida.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

// Devuelve el cuerpo de error de la API (o null si no hubo respuesta)
export function getApiError(error: unknown): ApiError | null {
  if (axios.isAxiosError<ApiError>(error) && error.response?.data) return error.response.data;
  return null;
}

// Mensaje para mostrar en pantalla
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) return 'No se pudo conectar con el servidor';
  const apiError = getApiError(error);
  if (!apiError) return 'Error inesperado';
  if (apiError.status === 429) return `Demasiadas solicitudes, reintenta en ${apiError.retryAfterSeconds ?? 'unos'} segundos`;
  return apiError.message;
}

// GET genérico para cualquier endpoint paginado: devuelve una página tipada
export async function getPaginated<T>(url: string, params: object, signal?: AbortSignal): Promise<Page<T>> {
  const { data } = await api.get<Page<T>>(url, { params, signal });
  return data;
}