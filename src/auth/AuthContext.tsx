import axios from 'axios';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler, tokenStorage } from '../api';
import { authService } from '../services/auth.service';
import type { LoginResponse, Team, User } from '../types';

// checking = hay token y lo estamos validando con /auth/me (NO se muestra el login)
type Status = 'checking' | 'authenticated' | 'anonymous';

interface AuthValue {
  status: Status;
  user: User | null;
  team: Team | null;
  login: (email: string, password: string) => Promise<void>;
  register: (teamName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [status, setStatus] = useState<Status>(() => (tokenStorage.get() ? 'checking' : 'anonymous'));

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setTeam(null);
    setStatus('anonymous');
  }, []);

  // Si cualquier request responde 401 (token vencido o inválido) → logout → login
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Restaurar sesión al recargar
  useEffect(() => {
    if (!tokenStorage.get()) return;
    const controller = new AbortController();
    authService
      .me(controller.signal)
      .then((res) => {
        setUser(res.user);
        setTeam(res.team);
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        if (axios.isCancel(error)) return;
        tokenStorage.clear();
        setStatus('anonymous');
      });
    return () => controller.abort();
  }, []);

  function saveSession(res: LoginResponse) {
    tokenStorage.set(res.token);
    setUser(res.user);
    setTeam(res.team);
    setStatus('authenticated');
  }

  async function login(email: string, password: string) {
    saveSession(await authService.login({ email, password }));
  }

  // El registro devuelve el JWT → entra directo con la sesión iniciada
  async function register(teamName: string, email: string, password: string) {
    saveSession(await authService.register({ teamName, email, password }));
  }

  return (
    <AuthContext.Provider value={{ status, user, team, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook para leer la sesión
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}