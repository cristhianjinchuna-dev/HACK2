import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getErrorMessage } from '../api';
import { sagasService } from '../services/sagas.service';
import { islandName, islandPoint, layoutPoints } from '../story/mapUtils';
import { navigateWithTransition, prefersReducedMotion, transitionName } from '../story/viewTransition';
import type { SagaStoryResponse, SagaSummary } from '../types';

export default function SagaStory() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  // La saga que mandó la lista: pinta el encabezado AL INSTANTE (destino de la View Transition)
  const preview = (location.state as { saga?: SagaSummary } | null)?.saga;

  const [story, setStory] = useState<SagaStoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [active, setActive] = useState(0); // índice de la etapa activa

  const stageRefs = useRef<(HTMLElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement | null>(null);

  // ---------- 1. Cargar la historia ----------
  useEffect(() => {
    const controller = new AbortController();
    setStory(null);
    setError(null);
    sagasService
      .story(id, controller.signal)
      .then((res) => setStory({ ...res, stages: [...res.stages].sort((a, b) => a.order - b.order) }))
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setError(getErrorMessage(err));
      });
    return () => controller.abort();
  }, [id, reload]);

  // ---------- 2. URL → etapa inicial: ?stage=slug lleva directo a esa etapa ----------
  useEffect(() => {
    if (!story) return;
    const index = Math.max(0, story.stages.findIndex((s) => s.slug === searchParams.get('stage')));
    setActive(index);
    // Espera a que se pinte y salta directo (sin animación) a esa etapa
    requestAnimationFrame(() => stageRefs.current[index]?.scrollIntoView({ block: 'center' }));
  }, [story]);

  // ---------- 3. Etapa activa según el scroll ----------
  useEffect(() => {
    if (!story) return;
    // Activa = la etapa que cruza la franja entre el 50% y el 60% de la pantalla
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: '-50% 0px -40% 0px' },
    );
    stageRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [story]);

  // ---------- 4. Etapa activa → URL (replace: no llena el historial) ----------
  useEffect(() => {
    const slug = story?.stages[active]?.slug;
    if (!slug || searchParams.get('stage') === slug) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('stage', slug);
        return next;
      },
      { replace: true },
    );
  }, [active, story]);

  // ---------- 5. Fallback de la barra de progreso (sin soporte o con reduced motion) ----------
  useEffect(() => {
    if (!story) return;
    const cssHandlesIt = CSS.supports('animation-timeline', 'scroll()') && !prefersReducedMotion();
    if (cssHandlesIt) return;
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progressRef.current?.style.setProperty('--story-progress', String(value));
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [story]);

  // ---------- 6. Teclado: al enfocar una etapa se centra y se vuelve activa ----------
  function handleStageFocus(index: number) {
    setActive(index);
    stageRefs.current[index]?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  }
  function focusStage(index: number) {
    stageRefs.current[index]?.focus({ preventScroll: true }); // dispara handleStageFocus
  }

  // Posiciones de las islas en el mapa (se calculan una vez por historia)
  const points = useMemo(() => (story ? layoutPoints(story.stages.map((s) => islandPoint(s.island))) : []), [story]);

  const title = story?.saga.title ?? preview?.title ?? 'Saga';
  const subtitle = story?.saga.subtitle ?? preview?.subtitle ?? '';
  const stage = story?.stages[active];
  const total = story?.stages.length ?? 0;
  const ship = points[active];
  const toPolyline = (list: typeof points) => list.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <section>
      {/* Progreso del recorrido */}
      {story && (
        <div className="fixed left-0 top-0 z-40 h-1.5 w-full bg-black/10" aria-hidden="true">
          <div ref={progressRef} className="story-progress h-full bg-black" />
        </div>
      )}

      <button
        onClick={() => navigateWithTransition(navigate, '/sagas')}
        className="mb-3 rounded border px-3 py-1 focus-visible:ring-4 focus-visible:ring-black"
      >
        ← Sagas
      </button>

      {/* Mismo viewTransitionName que la tarjeta de la lista */}
      <header style={transitionName(`saga-${id}`)} className="rounded-lg bg-slate-900 p-4 text-white">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm opacity-80">{subtitle}</p>
      </header>

      {error ? (
        <div className="mt-4 space-y-2">
          <p className="text-red-600">{error}</p>
          <button onClick={() => setReload((n) => n + 1)} className="rounded border px-3 py-1">Reintentar</button>
        </div>
      ) : !story ? (
        <p className="mt-4">Cargando historia...</p>
      ) : !stage || !ship ? (
        <p className="mt-4">Esta saga no tiene etapas.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-6 md:flex-row">
          {/* ---------- VISUAL PERSISTENTE (sticky): mapa + métricas ----------
              Mobile: fijo arriba. Desktop: columna derecha. */}
          <div className="sticky top-2 z-10 h-[55vh] w-full self-start md:order-2 md:h-[calc(100vh-1rem)] md:w-1/2">
            <div
              className="flex h-full flex-col gap-3 overflow-hidden rounded-2xl p-4 shadow-lg transition-colors duration-700 motion-reduce:transition-none"
              style={{ backgroundColor: stage.palette.background, color: stage.palette.text }}
            >
              <div>
                <p className="text-xs uppercase opacity-80">
                  Etapa {active + 1} de {total} · {islandName(stage.island)}
                </p>
                <h2 className="text-xl font-bold md:text-2xl">{stage.title}</h2>
              </div>

              {/* Mapa del Grand Line: barco en la isla activa + ruta recorrida */}
              <svg
                viewBox="0 0 100 100"
                className="min-h-0 w-full flex-1 rounded-lg"
                style={{ backgroundColor: stage.palette.surface }}
                role="img"
                aria-label={`Mapa: el barco está en ${islandName(stage.island)}`}
              >
                {/* Ruta completa (punteada) */}
                <polyline points={toPolyline(points)} fill="none" stroke={stage.palette.text} strokeOpacity={0.3} strokeWidth={0.6} strokeDasharray="2 2" />
                {/* Ruta recorrida hasta la etapa activa */}
                <polyline points={toPolyline(points.slice(0, active + 1))} fill="none" stroke={stage.palette.primary} strokeWidth={1.4} />
                {/* Islas */}
                {points.map((p, i) => (
                  <g key={story.stages[i].id}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={i === active ? 3 : 2}
                      fill={i <= active ? stage.palette.accent : stage.palette.text}
                      fillOpacity={i <= active ? 1 : 0.4}
                    />
                    <text x={p.x} y={p.y + 6} fontSize={3} textAnchor="middle" fill={stage.palette.text}>
                      {islandName(story.stages[i].island)}
                    </text>
                  </g>
                ))}
                {/* Barco: se mueve a la isla activa (sin animación con reduced motion) */}
                <g
                  className="transition-transform duration-700 motion-reduce:transition-none"
                  style={{ transform: `translate(${ship.x}px, ${ship.y - 3}px)` }}
                >
                  <text fontSize={7} textAnchor="middle" aria-hidden="true">⛵</text>
                </g>
              </svg>

              {/* Métricas de la etapa ACTIVA */}
              <dl aria-live="polite" className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {stage.metrics.map((m) => (
                  <div key={m.key} className="rounded-lg p-2" style={{ backgroundColor: stage.palette.surface }}>
                    <dt className="text-xs opacity-80">{m.label}</dt>
                    <dd className="text-lg font-bold">
                      {typeof m.value === 'number' ? m.value.toLocaleString() : m.value} {m.unit}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Navegación por teclado / botones */}
              <div className="flex justify-between gap-2">
                <button
                  onClick={() => focusStage(active - 1)}
                  disabled={active === 0}
                  className="rounded px-3 py-1 text-sm disabled:opacity-40 focus-visible:ring-4"
                  style={{ backgroundColor: stage.palette.primary, color: stage.palette.background }}
                >
                  ↑ Anterior
                </button>
                <button
                  onClick={() => focusStage(active + 1)}
                  disabled={active === total - 1}
                  className="rounded px-3 py-1 text-sm disabled:opacity-40 focus-visible:ring-4"
                  style={{ backgroundColor: stage.palette.primary, color: stage.palette.background }}
                >
                  Siguiente ↓
                </button>
              </div>
            </div>
          </div>

          {/* ---------- NARRATIVA POR ETAPAS ---------- */}
          <ol className="w-full space-y-6 pb-[45vh] md:order-1 md:w-1/2">
            {story.stages.map((s, i) => (
              <li key={s.id}>
                <article
                  ref={(el) => {
                    stageRefs.current[i] = el;
                  }}
                  data-index={i}
                  tabIndex={0} // enfocable con Tab
                  onFocus={() => handleStageFocus(i)}
                  aria-current={i === active ? 'step' : undefined}
                  className={`story-stage flex min-h-[70vh] flex-col justify-center rounded-xl border-l-8 bg-white p-6 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-black ${
                    i === active ? 'text-slate-900' : 'text-slate-400'
                  }`}
                  style={{ borderColor: s.palette.primary }}
                >
                  <p className="text-xs font-semibold uppercase">Etapa {i + 1} · {islandName(s.island)}</p>
                  <h3 className="text-2xl font-bold">{s.title}</h3>
                  <p className="mt-2">{s.narrative}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}