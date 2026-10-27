import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Wanted from './pages/Wanted';
import WantedDetail from './pages/WantedDetail';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Sagas from './pages/Sagas';
import SagaStory from './pages/SagaStory';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Privadas: requieren sesión */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/wanted" element={<Wanted />}>
            <Route path=":id" element={<WantedDetail />} />
          </Route>

          <Route path="/news" element={<News />}>
            <Route path=":id" element={<NewsDetail />} />
          </Route>

          {/* CP5 */}
          <Route path="/sagas" element={<Sagas />} />
          <Route path="/sagas/:id" element={<SagaStory />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}