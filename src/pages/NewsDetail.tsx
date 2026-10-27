import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import axios from 'axios';
import { getApiError, getErrorMessage } from '../api';
import { newsService } from '../services/news.service';
import { VERIFY_STATUSES, type NewsDetail as NewsDetailType, type NewsOutletContext, type VerifyStatus } from '../types';

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { onNewsUpdated } = useOutletContext<NewsOutletContext>(); // función del feed

  // ---------- Carga del detalle ----------
  const [news, setNews] = useState<NewsDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  // ---------- Verificación ----------
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [failedStatus, setFailedStatus] = useState<VerifyStatus | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  // Cerrar = volver al feed con los mismos filtros (sin volver a pedir nada)
  function close() {
    navigate({ pathname: '/news', search: location.search });
  }

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setNews(null);
    setError(null);
    setSaveError(null);
    setConfirmation(null);
    newsService
      .get(id, controller.signal)
      .then(setNews)
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setError(getErrorMessage(err));
      });
    return () => controller.abort();
  }, [id, reload]);

  async function verify(next: VerifyStatus) {
    if (!news || saving) return; // evita doble clic
    setSaving(true);
    setSaveError(null);
    setConfirmation(null);
    try {
      const updated = await newsService.verify(news.id, next);
      setNews(updated);       // el detalle muestra lo que devolvió el servidor
      onNewsUpdated(updated); // el feed se actualiza (o la retira)
      setFailedStatus(null);
      setConfirmation(`Noticia marcada como ${updated.status}`);
    } catch (err) {
      const apiError = getApiError(err);
      // 409: alguien ya la verificó → el servidor manda la noticia actual
      if (apiError?.code === 'NEWS_ALREADY_VERIFIED' && apiError.current) {
        setNews(apiError.current);
        onNewsUpdated(apiError.current);
        setSaveError(`Ya estaba verificada como ${apiError.current.status}.`);
        setFailedStatus(null);
      } else {
        // Otro error: NO tocamos "news" (conserva el estado anterior) y permitimos reintentar
        setSaveError(getErrorMessage(err));
        setFailedStatus(next);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/40" onClick={close}>
      <aside
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl"
      >
        <button onClick={close} className="mb-4 rounded border px-3 py-1">✕ Cerrar</button>

        {error ? (
          <div className="space-y-2">
            <p className="text-red-600">{error}</p>
            <button onClick={() => setReload((n) => n + 1)} className="rounded border px-3 py-1">Reintentar</button>
          </div>
        ) : !news ? (
          <p>Cargando noticia...</p>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{news.title}</h2>
            <p className="text-sm text-gray-500">{news.type} · {news.priority} · {news.source} · {news.island}</p>
            <p className="font-semibold">Estado: {news.status}</p>
            <p>{news.body}</p>
            {news.relatedWanted && <p className="text-sm">Relacionado con: {news.relatedWanted.name}</p>}

            {/* Solo un RUMOR se puede verificar */}
            {news.status === 'RUMOR' && (
              <div className="flex gap-2">
                {VERIFY_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => verify(s)}
                    disabled={saving}
                    className="flex-1 rounded bg-black px-3 py-2 text-white disabled:opacity-40"
                  >
                    {saving ? 'Guardando...' : `Marcar ${s}`}
                  </button>
                ))}
              </div>
            )}

            {confirmation && <p role="status" className="rounded bg-green-50 p-2 text-sm text-green-700">{confirmation}</p>}

            {saveError && (
              <div role="alert" className="space-y-2 rounded bg-red-50 p-2 text-sm text-red-700">
                <p>{saveError}</p>
                {failedStatus && (
                  <button onClick={() => verify(failedStatus)} disabled={saving} className="rounded border border-red-300 px-3 py-1 disabled:opacity-40">
                    Reintentar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}