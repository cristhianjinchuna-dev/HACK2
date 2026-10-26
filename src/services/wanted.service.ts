import { api, getPaginated } from '../api';
import type { Crew, WantedDetail, WantedQuery, WantedSummary } from '../types';

export const wantedService = {
  // GET /wanted?page=0&size=20&... (axios arma el query string con "params")
  list: (query: WantedQuery, signal?: AbortSignal) => getPaginated<WantedSummary>('/wanted', query, signal),

  // GET /wanted/{id}
  get: (id: string, signal?: AbortSignal) =>
    api.get<WantedDetail>(`/wanted/${id}`, { signal }).then((res) => res.data),

  // GET /crews → opciones del filtro de tripulación
  // (acepta la lista directa o envuelta en { items } / { content })
  crews: (signal?: AbortSignal) =>
    api
      .get<Crew[] | { items?: Crew[]; content?: Crew[] }>('/crews', { signal })
      .then((res) => (Array.isArray(res.data) ? res.data : res.data.items ?? res.data.content ?? [])),
};