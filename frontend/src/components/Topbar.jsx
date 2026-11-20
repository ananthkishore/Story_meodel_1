import { ChevronDown, Menu, Plus, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar({ onMenu }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const initials = user?.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'SC';
  const currentPage = location.pathname.startsWith('/projects/')
    ? 'Project details'
    : ({ '/': 'Overview', '/generate': 'Generate stories', '/projects': 'My projects', '/saved': 'Saved stories', '/settings': 'Settings' }[location.pathname] || 'Workspace');
  return (
    <header className="topbar">
      <div className="flex min-w-0 items-center gap-3">
        <button className="icon-button mobile-menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={19} /></button>
        <div className="breadcrumb"><span>Workspace</span><span className="text-slate-300">/</span><strong>{currentPage}</strong></div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <label className="top-search"><Search size={16} /><input placeholder="Search projects" aria-label="Search projects" onKeyDown={(event) => {
          if (event.key === 'Enter' && event.currentTarget.value.trim()) navigate(`/projects?search=${encodeURIComponent(event.currentTarget.value.trim())}`);
        }} /><kbd>Enter</kbd></label>
        <Link to="/generate" className="button-primary top-create"><Plus size={16} /><span>New project</span></Link>
        <div className="relative">
          <button className="profile-button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}>
            <span className="avatar">{initials}</span><span className="hidden max-w-[105px] truncate text-sm font-semibold text-ink md:block">{user?.name}</span><ChevronDown size={14} className="hidden text-slate-400 md:block" />
          </button>
          {profileOpen && <div className="profile-menu"><div className="border-b border-slate-100 px-4 py-3"><p className="truncate text-sm font-semibold text-ink">{user?.name}</p><p className="truncate text-xs text-muted">{user?.email}</p></div><Link to="/settings" onClick={() => setProfileOpen(false)}>Account settings</Link><button onClick={signOut}>Sign out</button></div>}
        </div>
      </div>
    </header>
  );
}
