import { api } from '../api';
import type { SagaStoryResponse, SagaSummary } from '../types';

export const sagasService = {
  // GET /sagas (acepta la lista directa o envuelta en { items } / { content })
  list: (signal?: AbortSignal) =>
    api
      .get<SagaSummary[] | { items?: SagaSummary[]; content?: SagaSummary[] }>('/sagas', { signal })
      .then((res) => (Array.isArray(res.data) ? res.data : res.data.items ?? res.data.content ?? [])),

  // GET /sagas/{id}/story
  story: (id: string, signal?: AbortSignal) =>
    api.get<SagaStoryResponse>(`/sagas/${id}/story`, { signal }).then((res) => res.data),
};