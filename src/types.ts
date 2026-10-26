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
export interface DashboardSummary {
  team: Team;
  wanted: Record<string, unknown>;
  crews: Record<string, unknown>;
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