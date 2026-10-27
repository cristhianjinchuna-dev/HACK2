// Tipos copiados del Swagger. Nada de `any`.

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Team {
  code: string; // TEAM-007
  name: string;
}

// POST /auth/login y POST /auth/register
export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresAt: string;
  user: User;
  team: Team;
}

// GET /auth/me
export interface MeResponse {
  user: User;
  team: Team;
  expiresAt: string;
}

// GET /log-pose
export interface LogPose {
  status: 'LOCKED' | 'UNLOCKED';
  grandLineUnlocked: boolean;
  unlockedAt: string | null;
  message: string;
}

// GET /dashboard/summary
// "wanted" y "crews" son objetos con contadores: se muestran tal como llegan
// GET /dashboard/summary
export interface DashboardSummary {
  team: Team;
  wanted: {
    total: number;
    totalBounty: number;
    averageBounty: number;
    byStatus: Record<string, number>; // { AT_LARGE: 81, CAPTURED: 32, MISSING: 24 }
    byFruit: Record<string, number>;  // { PARAMECIA: 32, ZOAN: 22, LOGIA: 14, NONE: 69 }
  };
  crews: {
    total: number;
    mostWanted: { id: string; name: string; shipName: string; memberCount: number; totalBounty: number } | null;
  };
  topBounties: { id: string; name: string; bounty: number }[];
  generatedAt: string;
}

// Formato único de error de la API
export interface ApiError {
  status: number;
  code: string; // ej: EMAIL_ALREADY_REGISTERED
  message: string;
  traceId: string;
  details?: { field: string; message: string }[];
  retryAfterSeconds?: number;
  current?: NewsDetail;
}


// ---------- CP2: Se Busca ----------
// Valores del contrato (Swagger: WantedStatus, FruitType)
export const WANTED_STATUSES = ['AT_LARGE', 'CAPTURED', 'MISSING'] as const;
export const FRUIT_TYPES = ['PARAMECIA', 'ZOAN', 'LOGIA'] as const;
export const SORTS = ['bounty,desc', 'name,asc', 'updatedAt,desc'] as const;
export const PAGE_SIZES: number[] = [10, 20, 50];

export type WantedStatus = (typeof WANTED_STATUSES)[number];
export type FruitType = (typeof FRUIT_TYPES)[number];
export type Sort = (typeof SORTS)[number];

// Type guard: ¿el texto de la URL es un valor permitido?
export function isOneOf<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value);
}

// Respuesta paginada (WantedPage)
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface CrewRef {
  id: string;
  name: string;
}

export interface Crew {
  id: string;
  name: string;
  shipName: string;
  jollyRogerColor: string;
  memberCount: number;
  totalBounty: number;
}

// Un cartel en el listado (WantedSummary)
export interface WantedSummary {
  id: string;
  name: string;
  epithet: string;
  bounty: number;
  status: WantedStatus;
  crew: CrewRef | null;
  role: string;
  devilFruit: { name: string; type: FruitType } | null;
  threatLevel: number;
  lastSeenIsland: string;
  updatedAt: string;
}

// El detalle trae lo mismo + más campos (WantedDetail)
export interface WantedDetail extends WantedSummary {
  age: number;
  heightCm: number;
  bio: string;
  lastSeen: Record<string, unknown>;
  bountyHistory: unknown[];
}

// Parámetros de GET /wanted ('' = sin filtro)
export interface WantedQuery {
  page: number;
  size: number;
  sort: Sort;
  status: WantedStatus | '';
  crewId: string;
  fruit: FruitType | '';
  q: string;
}

export const NEWS_TYPES: string[] = ['BOUNTY_UPDATE', 'BATTLE', 'MARINE_OPERATION', 'WORLD_GOVERNMENT', 'DISCOVERY'];
export const NEWS_PRIORITIES: string[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const NEWS_STATUSES = ['RUMOR', 'CONFIRMED', 'DEBUNKED'] as const;
export type NewsStatus = (typeof NEWS_STATUSES)[number];

// Solo un RUMOR se puede verificar como CONFIRMED o DEBUNKED
export const VERIFY_STATUSES = ['CONFIRMED', 'DEBUNKED'] as const;
export type VerifyStatus = (typeof VERIFY_STATUSES)[number];

// Una noticia en el feed (NewsItem)
export interface NewsItem {
  id: string;
  type: string;
  priority: string;
  status: NewsStatus;
  title: string;
  summary: string;
  source: string;
  island: string;
  relatedWanted: { id: string; name: string } | null;
  publishedAt: string;
  updatedAt: string;
  verifiedAt: string | null;
}

// El detalle trae lo mismo + el cuerpo (NewsDetail)
export interface NewsDetail extends NewsItem {
  body: string;
}

// GET /news/feed (cursor)
export interface NewsFeed {
  items: NewsItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Filtros del feed ('' = sin filtro)
export interface NewsFilters {
  type: string;
  priority: string;
  status: NewsStatus | '';
}

// Lo que el feed le pasa al detalle por <Outlet context>
export interface NewsOutletContext {
  onNewsUpdated: (news: NewsItem) => void;
}

// ---------- CP5: Sagas ----------
// Colores hexadecimales de la saga / etapa
export interface Palette {
  background: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
}

// GET /sagas (SagaSummary)
export interface SagaSummary {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  synopsis: string;
  stageCount: number;
  totalDistanceNm: number;
  firstIsland: string;
  lastIsland: string;
  palette: Palette;
}

// Una métrica de la etapa (StageMetric)
export interface StageMetric {
  key: string;
  label: string;
  value: number | string;
  unit: string;
}

// Una etapa de la historia (SagaStage)
export interface SagaStage {
  id: string;
  order: number;
  slug: string;
  title: string;
  narrative: string;
  island: Record<string, unknown>; // nombre + posición en el mapa (se lee en mapUtils.ts)
  palette: Palette;
  metrics: StageMetric[];
}

// GET /sagas/{id}/story (SagaStory)
export interface SagaStoryResponse {
  saga: SagaSummary;
  map: Record<string, unknown>;
  stages: SagaStage[];
}