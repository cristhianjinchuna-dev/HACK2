import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getErrorMessage } from '../api';
import { sagasService } from '../services/sagas.service';
import { navigateWithTransition, transitionName } from '../story/viewTransition';
import type { SagaSummary } from '../types';

// Resumen de sagas: punto de partida de la View Transition
export default function Sagas() {
  const navigate = useNavigate();
  const [sagas, setSagas] = useState<SagaSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    sagasService
      .list(controller.signal)
      .then((list) => setSagas([...list].sort((a, b) => a.order - b.order)))
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setError(getErrorMessage(err));
      });
    return () => controller.abort();
  }, [reload]);

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-red-600">{error}</p>
        <button onClick={() => setReload((n) => n + 1)} className="rounded border px-3 py-1">Reintentar</button>
      </div>
    );
  }
  if (!sagas) return <p>Cargando sagas...</p>;
  if (sagas.length === 0) return <p>No hay sagas disponibles.</p>;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">La Gran Saga</h1>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sagas.map((s) => {
          const to = `/sagas/${s.id}`;
          return (
            <li key={s.id}>
              <Link
                to={to}
                state={{ saga: s }}
                onClick={(e) => {
                  e.preventDefault(); // navegamos con View Transition
                  navigateWithTransition(navigate, to, { saga: s });
                }}
                className="block rounded-xl border bg-white p-3 shadow-sm hover:shadow-md focus-visible:ring-4 focus-visible:ring-black"
              >
                {/* Este bloque "vuela" hasta el encabezado de la historia */}
                <div
                  style={{ ...transitionName(`saga-${s.id}`), backgroundColor: s.palette.background, color: s.palette.text }}
                  className="rounded-lg p-3"
                >
                  <h2 className="text-lg font-bold">{s.title}</h2>
                  <p className="text-sm opacity-80">{s.subtitle}</p>
                </div>
                <p className="mt-2 text-sm">{s.synopsis}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {s.stageCount} etapas · {s.totalDistanceNm.toLocaleString()} millas · {s.firstIsland} → {s.lastIsland}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}