import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getApiError, getErrorMessage } from '../api';

type Field = 'teamName' | 'email' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

// Coloca cada error del servidor junto a su campo
function toFieldErrors(error: unknown): FieldErrors {
  const apiError = getApiError(error);
  if (!apiError) return {};
  if (apiError.code === 'EMAIL_ALREADY_REGISTERED') return { email: apiError.message };
  if (apiError.code === 'TEAM_NAME_TAKEN') return { teamName: apiError.message };

  // VALIDATION_ERROR: details = [{ field, message }]
  const result: FieldErrors = {};
  for (const d of apiError.details ?? []) {
    if (d.field === 'teamName' || d.field === 'email' || d.field === 'password') result[d.field] = d.message;
  }
  return result;
}

export default function Register() {
  const { status, register } = useAuth();
  const location = useLocation();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const state = location.state as { from?: string } | null;
  if (status === 'authenticated') return <Navigate to={state?.from ?? '/dashboard'} replace />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);
    try {
      await register(
        String(data.get('teamName')).trim(),
        String(data.get('email')).trim(),
        String(data.get('password')),
      );
    } catch (err) {
      const fields = toFieldErrors(err);
      setFieldErrors(fields);
      // Si el error no es de un campo (ej: REGISTRATION_CLOSED o sin conexión), mensaje general
      if (Object.keys(fields).length === 0) setGeneralError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-20 flex max-w-sm flex-col gap-3 p-4">
      <h1 className="text-2xl font-bold">Registrar tripulación</h1>

      <input name="teamName" placeholder="Nombre de la tripulación" required className="rounded border p-2" />
      {fieldErrors.teamName && <p className="text-sm text-red-600">{fieldErrors.teamName}</p>}

      <input name="email" type="email" placeholder="Email" required className="rounded border p-2" />
      {fieldErrors.email && <p className="text-sm text-red-600">{fieldErrors.email}</p>}

      <input name="password" type="password" placeholder="Contraseña" required className="rounded border p-2" />
      {fieldErrors.password && <p className="text-sm text-red-600">{fieldErrors.password}</p>}

      {generalError && <p className="text-red-600">{generalError}</p>}

      <button disabled={submitting} className="rounded bg-black p-2 text-white disabled:opacity-50">
        {submitting ? 'Registrando...' : 'Registrar y entrar'}
      </button>
      <Link to="/login" state={location.state} className="text-sm underline">
        Ya tengo cuenta
      </Link>
    </form>
  );
}