import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getErrorMessage } from '../api';
import { newsService } from '../services/news.service';
import {
  isOneOf, NEWS_PRIORITIES, NEWS_STATUSES, NEWS_TYPES,
  type NewsFilters, type NewsItem, type NewsOutletContext,
} from '../types';

const PAGE_LIMIT = 20;

// Lee los filtros de la URL; valores inválidos se ignoran
function readFilters(params: URLSearchParams): NewsFilters {
  const type = params.get('type') ?? '';
  const priority = params.get('priority') ?? '';
  const status = params.get('status') ?? '';
  return {
    type: NEWS_TYPES.includes(type) ? type : '',
    priority: NEWS_PRIORITIES.includes(priority) ? priority : '',
    status: isOneOf(NEWS_STATUSES, status) ? status : '',
  };
}

export default function News() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { type, priority, status } = readFilters(searchParams);

  // ---------- Estado que se ve en pantalla ----------
  const [items, setItems] = useState<NewsItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- Refs: valores que la lógica necesita AL INSTANTE ----------
  const cursorRef = useRef<string | null>(null);   // cursor de la siguiente página
  const inFlightRef = useRef(false);                // candado: ¿ya hay una carga en vuelo?
  const generationRef = useRef(0);                  // versión de los filtros actuales
  const controllerRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null); // div invisible al final

  // Carga una página. first = true → primera página (cursor vacío)
  async function fetchPage(first: boolean) {
    if (inFlightRef.current) return; // UNA sola carga en vuelo
    inFlightRef.current = true;

    const generation = generationRef.current; // con qué filtros empezó esta request
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const res = await newsService.feed(
        { type, priority, status, cursor: first ? '' : cursorRef.current ?? '', limit: PAGE_LIMIT },
        controller.signal,
      );
      // Si los filtros cambiaron mientras esperábamos → respuesta vieja, se descarta
      if (generation !== generationRef.current) return;

      cursorRef.current = res.nextCursor;
      setHasMore(res.hasMore);
      // Ninguna noticia dos veces: solo agregamos IDs nuevos
      setItems((prev) => {
        const seen = new Set(prev.map((n) => n.id));
        return [...prev, ...res.items.filter((n) => !seen.has(n.id))];
      });
    } catch (err) {
      if (axios.isCancel(err) || generation !== generationRef.current) return;
      setError(getErrorMessage(err)); // NO se borran las noticias ya cargadas
    } finally {
      if (generation === generationRef.current) {
        inFlightRef.current = false;
        setLoading(false);
      }
    }
  }

  // El observer siempre llama a la versión más reciente (con los filtros actuales)
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  // Cambian los filtros → reiniciar todo y cargar la primera página
  useEffect(() => {
    generationRef.current += 1;     // lo anterior queda obsoleto (nunca se mezcla)
    controllerRef.current?.abort(); // cancela la request en vuelo
    inFlightRef.current = false;
    cursorRef.current = null;       // filtros nuevos → cursor nuevo
    setItems([]);
    setHasMore(true);
    fetchPageRef.current(true);
    return () => controllerRef.current?.abort();
  }, [type, priority, status]);

  // Infinite scroll: cuando el sentinel entra en pantalla → siguiente página
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return; // sin sentinel si hay error o no hay más
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchPageRef.current(false);
      },
      { rootMargin: '300px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length, hasMore, error]);

  // Escribe un filtro en la URL
  function updateFilter(key: keyof NewsFilters, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  }

  // Reconciliación: el detalle avisa cuando una noticia fue verificada
  function handleNewsUpdated(updated: NewsItem) {
    // Si hay filtro de estado y ya no lo cumple (ej: filtro RUMOR → CONFIRMED), se retira
    if (status && updated.status !== status) {
      setItems((prev) => prev.filter((n) => n.id !== updated.id));
      return;
    }
    // Si lo sigue cumpliendo, se reemplaza en su mismo lugar
    setItems((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  }

  const outletContext: NewsOutletContext = { onNewsUpdated: handleNewsUpdated };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Noticias del Mundo</h1>

      {/* Filtros persistidos en la URL */}
      <div className="flex flex-wrap gap-2">
        <select value={type} onChange={(e) => updateFilter('type', e.target.value)} className="rounded border p-2">
          <option value="">Todos los tipos</option>
          {NEWS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={priority} onChange={(e) => updateFilter('priority', e.target.value)} className="rounded border p-2">
          <option value="">Todas las prioridades</option>
          {NEWS_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={status} onChange={(e) => updateFilter('status', e.target.value)} className="rounded border p-2">
          <option value="">Todos los estados</option>
          {NEWS_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id}>
            {/* Abre el detalle conservando los filtros */}
            <Link
              to={{ pathname: `/news/${n.id}`, search: location.search }}
              className="block rounded border bg-white p-3 hover:bg-gray-50"
            >
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span>{n.type}</span>
                <span>· {n.priority}</span>
                <span>· {n.status}</span>
              </div>
              <p className="mt-1 font-medium">{n.title}</p>
              <p className="text-sm">{n.summary}</p>
              <p className="text-xs text-gray-500">
                {n.source} · {n.island} · {new Date(n.publishedAt).toLocaleString()}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {/* ---------- Estados al final de la lista ---------- */}
      {loading && (
        <p className="p-4 text-center text-gray-500">{items.length === 0 ? 'Cargando noticias...' : 'Cargando más...'}</p>
      )}

      {error && (
        <div className="flex flex-col items-center gap-2 p-4">
          <p className="text-red-600">{error}</p>
          {/* Reintenta la misma página; lo cargado se conserva */}
          <button onClick={() => fetchPage(items.length === 0)} className="rounded border px-3 py-1">Reintentar</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && <p className="p-4 text-center">Sin noticias para estos filtros.</p>}

      {!hasMore && items.length > 0 && <p className="p-4 text-center text-gray-500">No hay más noticias.</p>}

      {/* Sentinel invisible que vigila el IntersectionObserver */}
      {items.length > 0 && hasMore && !error && <div ref={sentinelRef} className="h-1" />}

      {/* /news/:id se pinta aquí ENCIMA: el feed nunca se desmonta */}
      <Outlet context={outletContext} />
    </section>
  );
}