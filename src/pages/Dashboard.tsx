import { useEffect, useState } from 'react';
import axios from 'axios';
import { getErrorMessage } from '../api';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardSummary, LogPose } from '../types';

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [logPose, setLogPose] = useState<LogPose | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0); // cambiarlo vuelve a pedir los datos

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    setSummary(null);
    // Las dos consultas en paralelo
    Promise.all([dashboardService.summary(controller.signal), dashboardService.logPose(controller.signal)])
      .then(([s, l]) => {
        setSummary(s);
        setLogPose(l);
      })
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setError(getErrorMessage(err));
      });
    return () => controller.abort();
  }, [reload]);

  // Error con reintento
  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-red-600">{error}</p>
        <button onClick={() => setReload((n) => n + 1)} className="rounded border px-3 py-1">Reintentar</button>
      </div>
    );
  }
  // Loading
  if (!summary || !logPose) return <p>Cargando...</p>;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">{summary.team.name} · {summary.team.code}</h1>

      {/* Estado del Log Pose */}
      <article className={`rounded border p-4 ${logPose.grandLineUnlocked ? 'bg-green-50' : 'bg-amber-50'}`}>
        <h2 className="font-semibold">Log Pose: {logPose.status}</h2>
        <p>{logPose.message}</p>
        {logPose.unlockedAt && <p className="text-sm">Desbloqueado: {new Date(logPose.unlockedAt).toLocaleString()}</p>}
      </article>

      {/* Indicadores de carteles y tripulaciones (los campos vienen del backend) */}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { title: 'Carteles', data: summary.wanted },
          { title: 'Tripulaciones', data: summary.crews },
        ].map((block) => (
          <article key={block.title} className="rounded border bg-white p-4">
            <h2 className="mb-2 font-semibold">{block.title}</h2>
            <dl className="grid grid-cols-2 gap-1 text-sm">
              {Object.entries(block.data).map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-gray-500">{key}</dt>
                  <dd className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      {/* Mayores recompensas, con estado vacío */}
      <article className="rounded border bg-white p-4">
        <h2 className="mb-2 font-semibold">Mayores recompensas</h2>
        {summary.topBounties.length === 0 ? (
          <p className="text-gray-500">Aún no hay carteles.</p>
        ) : (
          <ul>
            {summary.topBounties.map((b) => (
              <li key={b.id}>{b.name}: ฿{b.bounty.toLocaleString()}</li>
            ))}
          </ul>
        )}
      </article>

      <p className="text-sm text-gray-500">Generado: {new Date(summary.generatedAt).toLocaleString()}</p>
    </section>
  );
}