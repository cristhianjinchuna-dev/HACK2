import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../api';

export default function Login() {
  const { status, login } = useAuth();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const state = location.state as { from?: string } | null;
  const from = state?.from ?? '/dashboard';

  if (status === 'checking') return <p className="p-6">Restaurando sesión...</p>;
  if (status === 'authenticated') return <Navigate to={from} replace />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await login(String(data.get('email')).trim(), String(data.get('password')));
      // Al pasar a "authenticated", el <Navigate> de arriba redirige solo
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-20 flex max-w-sm flex-col gap-3 p-4">
      <h1 className="text-2xl font-bold">Log Pose Console</h1>
      <input name="email" type="email" placeholder="Email" required className="rounded border p-2" />
      <input name="password" type="password" placeholder="Contraseña" required className="rounded border p-2" />
      {error && <p className="text-red-600">{error}</p>}
      <button disabled={submitting} className="rounded bg-black p-2 text-white disabled:opacity-50">
        {submitting ? 'Ingresando...' : 'Ingresar'}
      </button>
      {/* Pasamos el state para no perder "from" */}
      <Link to="/register" state={location.state} className="text-sm underline">
        Registrar tripulación
      </Link>
    </form>
  );
}