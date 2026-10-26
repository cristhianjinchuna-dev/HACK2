import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  // Mientras se verifica el token, NO se muestra el login
  if (status === 'checking') return <p className="p-6">Restaurando sesión...</p>;

  if (status === 'anonymous') {
    // Guarda a dónde quería ir (con su query) para volver exactamente ahí
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}