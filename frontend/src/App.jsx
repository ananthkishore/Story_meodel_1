import { Navigate, Route, Routes } from 'react-router-dom';
import { PageLoader } from './components/Loading.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import GeneratePage from './pages/GeneratePage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import SavedStoriesPage from './pages/SavedStoriesPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function PrivateRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <AppLayout /> : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return <Routes>
    <Route path="/login" element={<AuthPage />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route element={<PrivateRoutes />}>
      <Route index element={<DashboardPage />} />
      <Route path="/generate" element={<GeneratePage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
      <Route path="/saved" element={<SavedStoriesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
  </Routes>;
}
