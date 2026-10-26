import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getErrorMessage } from '../api';
import { wantedService } from '../services/wanted.service';
import type { WantedDetail as WantedDetailType } from '../types';

// Panel encima del listado. Al cerrarlo, el listado sigue exactamente igual.
export default function WantedDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [detail, setDetail] = useState<WantedDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  // Volver al listado con los mismos filtros de la URL
  function close() {
    navigate({ pathname: '/wanted', search: location.search });
  }

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setDetail(null);
    setError(null);
    wantedService
      .get(id, controller.signal)
      .then(setDetail)
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setError(getErrorMessage(err));
      });
    return () => controller.abort();
  }, [id, reload]);

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/40" onClick={close}>
      <aside
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()} // clic adentro no cierra
        className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl"
      >
        <button onClick={close} className="mb-4 rounded border px-3 py-1">✕ Cerrar</button>

        {error ? (
          <div className="space-y-2">
            <p className="text-red-600">{error}</p>
            <button onClick={() => setReload((n) => n + 1)} className="rounded border px-3 py-1">Reintentar</button>
          </div>
        ) : !detail ? (
          <p>Cargando cartel...</p>
        ) : (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">{detail.name}</h2>
            <p className="italic">"{detail.epithet}"</p>
            <p className="text-xl font-semibold">฿{detail.bounty.toLocaleString()}</p>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-500">Estado</dt><dd>{detail.status}</dd>
              <dt className="text-gray-500">Tripulación</dt><dd>{detail.crew?.name ?? '—'}</dd>
              <dt className="text-gray-500">Rol</dt><dd>{detail.role}</dd>
              <dt className="text-gray-500">Fruta</dt>
              <dd>{detail.devilFruit ? `${detail.devilFruit.name} (${detail.devilFruit.type})` : '—'}</dd>
              <dt className="text-gray-500">Amenaza</dt><dd>{detail.threatLevel}</dd>
              <dt className="text-gray-500">Edad</dt><dd>{detail.age}</dd>
              <dt className="text-gray-500">Altura</dt><dd>{detail.heightCm} cm</dd>
              <dt className="text-gray-500">Última isla</dt><dd>{detail.lastSeenIsland}</dd>
            </dl>
            <p>{detail.bio}</p>
            <p className="text-sm text-gray-500">Historial de recompensas: {detail.bountyHistory.length} registros</p>
          </div>
        )}
      </aside>
    </div>
  );
}