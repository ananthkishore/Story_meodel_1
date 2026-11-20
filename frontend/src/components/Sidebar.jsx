import { Bookmark, ChevronLeft, ChevronRight, FolderKanban, LayoutDashboard, Settings2, Sparkles, WandSparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/generate', label: 'Generate stories', icon: WandSparkles },
  { to: '/projects', label: 'My projects', icon: FolderKanban },
  { to: '/saved', label: 'Saved stories', icon: Bookmark }
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onNavigate }) {
  return (
    <>
      <div className={`sidebar-backdrop ${mobileOpen ? 'is-visible' : ''}`} onClick={onNavigate} />
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="flex h-[76px] items-center gap-3 px-5">
          <div className="brand-mark"><Sparkles size={20} fill="currentColor" /></div>
          {!collapsed && <div className="min-w-0"><p className="text-[15px] font-bold tracking-tight text-ink">StoryCraft <span className="text-brand-600">AI</span></p><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">Product workspace</p></div>}
        </div>
        <div className="px-3 pt-7">
          {!collapsed && <p className="nav-caption">Workspace</p>}
          <nav className="mt-3 space-y-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} title={collapsed ? label : undefined} onClick={onNavigate}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}>
                <Icon size={19} strokeWidth={1.8} /><span className={collapsed ? 'sr-only' : ''}>{label}</span>
                {!collapsed && label === 'Generate stories' && <span className="ml-auto rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">AI</span>}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 border-t border-slate-100 pt-5">
            {!collapsed && <p className="nav-caption">Preferences</p>}
            <NavLink to="/settings" title={collapsed ? 'Settings' : undefined} onClick={onNavigate}
              className={({ isActive }) => `nav-link mt-3 ${isActive ? 'nav-link-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}>
              <Settings2 size={19} strokeWidth={1.8} /><span className={collapsed ? 'sr-only' : ''}>Settings</span>
            </NavLink>
          </div>
        </div>
        {!collapsed && <div className="sidebar-tip">
          <div className="mb-3 grid h-8 w-8 place-items-center rounded-xl bg-white/10"><Sparkles size={16} /></div>
          <p className="text-sm font-semibold">From idea to backlog</p>
          <p className="mt-1 text-xs leading-5 text-indigo-100/70">Turn a few lines of context into a clear, actionable plan.</p>
          <NavLink to="/generate" onClick={onNavigate} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white hover:gap-2">Try story generator <ChevronRight size={14} /></NavLink>
        </div>}
        <button className="sidebar-collapse" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
}
