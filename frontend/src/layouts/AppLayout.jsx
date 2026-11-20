import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <div className={`app-main ${collapsed ? 'app-main-wide' : ''}`}>
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
