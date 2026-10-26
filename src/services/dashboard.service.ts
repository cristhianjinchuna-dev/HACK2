import { api } from '../api';
import type { DashboardSummary, LogPose } from '../types';

export const dashboardService = {
  summary: (signal?: AbortSignal) =>
    api.get<DashboardSummary>('/dashboard/summary', { signal }).then((res) => res.data),

  logPose: (signal?: AbortSignal) => api.get<LogPose>('/log-pose', { signal }).then((res) => res.data),
};