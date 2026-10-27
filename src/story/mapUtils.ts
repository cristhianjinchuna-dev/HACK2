// Lee el nombre y la posición de una isla, y los ubica en un mapa de 100 x 100.

export interface Point {
  x: number;
  y: number;
}

function asNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function islandName(island: Record<string, unknown>): string {
  return typeof island.name === 'string' ? island.name : 'Isla';
}

// Busca la posición: island.x/y, island.position, island.coordinates, island.coords o lat/lng
export function islandPoint(island: Record<string, unknown>): Point | null {
  const candidates = [island, asRecord(island.position), asRecord(island.coordinates), asRecord(island.coords)];
  for (const c of candidates) {
    if (!c) continue;
    const x = asNumber(c.x);
    const y = asNumber(c.y);
    if (x !== null && y !== null) return { x, y };
    const lng = asNumber(c.lng) ?? asNumber(c.lon) ?? asNumber(c.longitude);
    const lat = asNumber(c.lat) ?? asNumber(c.latitude);
    if (lng !== null && lat !== null) return { x: lng, y: -lat }; // en el SVG "arriba" es y menor
  }
  return null;
}

// Escala todas las posiciones al rango 8..92 del mapa.
// Si alguna isla no trae posición, se reparten a lo largo de una ruta.
export function layoutPoints(raw: (Point | null)[]): Point[] {
  const n = raw.length;
  if (n === 0) return [];
  const pts = raw.filter((p): p is Point => p !== null);
  if (pts.length !== n) {
    return raw.map((_, i) => ({ x: n === 1 ? 50 : 8 + (84 * i) / (n - 1), y: 50 + 25 * Math.sin(i * 1.3) }));
  }
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const scale = (v: number, min: number, max: number) => (max === min ? 50 : 8 + ((v - min) / (max - min)) * 84);
  return pts.map((p) => ({
    x: scale(p.x, Math.min(...xs), Math.max(...xs)),
    y: scale(p.y, Math.min(...ys), Math.max(...ys)),
  }));
}