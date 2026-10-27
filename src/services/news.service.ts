import { api } from '../api';
import type { NewsDetail, NewsFeed, NewsFilters, VerifyStatus } from '../types';

export const newsService = {
  // GET /news/feed?cursor=...&limit=20&type=&priority=&status=
  feed: (params: NewsFilters & { cursor: string; limit: number }, signal?: AbortSignal) =>
    api.get<NewsFeed>('/news/feed', { params, signal }).then((res) => res.data),

  // GET /news/{id}
  get: (id: string, signal?: AbortSignal) =>
    api.get<NewsDetail>(`/news/${id}`, { signal }).then((res) => res.data),

  // PATCH /news/{id}/status → devuelve la noticia actualizada
  verify: (id: string, status: VerifyStatus) =>
    api.patch<NewsDetail>(`/news/${id}/status`, { status }).then((res) => res.data),
};