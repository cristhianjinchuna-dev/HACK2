import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { team, logout } = useAuth();

  return (
    <>
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-slate-900 p-3 text-white">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/wanted">Se Busca</Link>
        <span className="ml-auto">{team?.name} · {team?.code}</span>
        <button onClick={logout} className="rounded border px-2">Cerrar sesión</button>
      </nav>
      <main className="p-4">
        <Outlet />
      </main>
    </>
  );
}