import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getErrorMessage } from '../api';
import { wantedService } from '../services/wanted.service';
import SearchInput from '../components/SearchInput';
import {
  FRUIT_TYPES, isOneOf, PAGE_SIZES, SORTS, WANTED_STATUSES,
  type Crew, type Page, type Sort, type WantedQuery, type WantedSummary,
} from '../types';

// Texto del select de orden (solo UI)
const SORT_LABELS: Record<Sort, string> = {
  'bounty,desc': 'Mayor recompensa',
  'name,asc': 'Nombre A-Z',
  'updatedAt,desc': 'Más recientes',
};

// Lee la URL y la convierte en un query válido.
// Una URL con valores inválidos usa los valores por defecto → la vista no se rompe.
function readQuery(params: URLSearchParams): WantedQuery {
  const page = Number(params.get('page') ?? 0);
  const size = Number(params.get('size') ?? 20);
  const sort = params.get('sort') ?? '';
  const status = params.get('status') ?? '';
  const fruit = params.get('fruit') ?? '';
  return {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    size: PAGE_SIZES.includes(size) ? size : 20,
    sort: isOneOf(SORTS, sort) ? sort : 'bounty,desc',
    status: isOneOf(WANTED_STATUSES, status) ? status : '',
    fruit: isOneOf(FRUIT_TYPES, fruit) ? fruit : '',
    crewId: params.get('crewId') ?? '',
    q: params.get('q') ?? '',
  };
}

export default function Wanted() {
  // La URL es la fuente de verdad: recargar, compartir o atrás/adelante muestran lo mismo
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { page, size, sort, status, crewId, fruit, q } = readQuery(searchParams);

  const [data, setData] = useState<Page<WantedSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [crews, setCrews] = useState<Crew[]>([]);

  // Escribe cambios en la URL. Cambiar filtros, búsqueda, orden o tamaño → página 0
  function updateParams(changes: Partial<Record<keyof WantedQuery, string>>, resetPage = true) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key); // vacío = sin filtro
      }
      if (resetPage) next.set('page', '0');
      return next;
    });
  }

  // Tripulaciones para el filtro (una vez)
  useEffect(() => {
    const controller = new AbortController();
    wantedService
      .crews(controller.signal)
      .then(setCrews)
      .catch(() => {}); // si falla, el filtro solo muestra "Todas"
    return () => controller.abort();
  }, []);

  // Fetch paginado: se repite cada vez que cambia algo de la URL
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    wantedService
      .list({ page, size, sort, status, crewId, fruit, q }, controller.signal)
      .then((res) => {
        // Protección contra respuestas antiguas: si ya hubo otro cambio, se ignora
        if (controller.signal.aborted) return;
        setData(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err) || controller.signal.aborted) return;
        setError(getErrorMessage(err));
        setLoading(false);
      });
    // Cleanup: al cambiar algo, cancela la request anterior
    return () => controller.abort();
  }, [page, size, sort, status, crewId, fruit, q, reload]);

  // Nunca quedarse en una página que no existe (ej: ?page=99)
  useEffect(() => {
    if (!loading && data && data.totalPages > 0 && page >= data.totalPages) {
      updateParams({ page: String(data.totalPages - 1) }, false);
    }
  }, [loading, data, page]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Se Busca</h1>

      {/* Filtros: leen de la URL y escriben en la URL */}
      <div className="flex flex-wrap gap-2">
        <SearchInput value={q} onSearch={(text) => updateParams({ q: text })} />

        <select value={status} onChange={(e) => updateParams({ status: e.target.value })} className="rounded border p-2">
          <option value="">Todos los estados</option>
          {WANTED_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={crewId} onChange={(e) => updateParams({ crewId: e.target.value })} className="rounded border p-2">
          <option value="">Todas las tripulaciones</option>
          {crews.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={fruit} onChange={(e) => updateParams({ fruit: e.target.value })} className="rounded border p-2">
          <option value="">Todas las frutas</option>
          {FRUIT_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        <select value={sort} onChange={(e) => updateParams({ sort: e.target.value })} className="rounded border p-2">
          {SORTS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
        </select>

        <select value={size} onChange={(e) => updateParams({ size: e.target.value })} className="rounded border p-2">
          {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} por página</option>)}
        </select>
      </div>

      {/* Caja de altura fija: loading, error y sin resultados NO mueven el layout */}
      <div className="relative min-h-[560px] overflow-x-auto rounded border bg-white">
        {error ? (
          <div className="flex h-[560px] flex-col items-center justify-center gap-2">
            <p className="text-red-600">{error}</p>
            <button onClick={() => setReload((n) => n + 1)} className="rounded border px-3 py-1">Reintentar</button>
          </div>
        ) : !data ? (
          <p className="p-6">Cargando...</p>
        ) : data.content.length === 0 ? (
          <p className="p-6">Sin resultados para estos filtros.</p>
        ) : (
          // Mientras carga, los datos anteriores se ven atenuados y sin clics
          <table className={`w-full text-left text-sm ${loading ? 'pointer-events-none opacity-40' : ''}`}>
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-2">Nombre</th>
                <th className="p-2">Epíteto</th>
                <th className="p-2">Recompensa</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Tripulación</th>
                <th className="p-2">Fruta</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {data.content.map((w) => (
                <tr key={w.id} className="border-b">
                  <td className="p-2 font-medium">{w.name}</td>
                  <td className="p-2">{w.epithet}</td>
                  <td className="p-2">฿{w.bounty.toLocaleString()}</td>
                  <td className="p-2">{w.status}</td>
                  <td className="p-2">{w.crew?.name ?? '—'}</td>
                  <td className="p-2">{w.devilFruit ? `${w.devilFruit.name} (${w.devilFruit.type})` : '—'}</td>
                  <td className="p-2">
                    {/* Abre el detalle conservando la URL con los filtros */}
                    <Link to={{ pathname: `/wanted/${w.id}`, search: location.search }} className="underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {loading && data && <span className="absolute right-3 top-2 text-xs text-gray-500">Actualizando...</span>}
      </div>

      {/* Paginación real del servidor */}
      {data && (
        <div className="flex items-center justify-between text-sm">
          <span>
            {data.totalElements} carteles · Página {data.totalPages === 0 ? 0 : page + 1} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => updateParams({ page: String(page - 1) }, false)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              disabled={page + 1 >= data.totalPages}
              onClick={() => updateParams({ page: String(page + 1) }, false)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* /wanted/:id se pinta aquí ENCIMA: el listado nunca se desmonta */}
      <Outlet />
    </section>
  );
}