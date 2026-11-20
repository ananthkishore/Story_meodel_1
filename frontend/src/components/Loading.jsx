export function PageLoader() {
  return <div className="grid min-h-screen place-items-center"><div className="flex items-center gap-3 text-sm font-medium text-slate-500"><span className="spinner" /> Loading your workspace</div></div>;
}

export function InlineLoader({ label = 'Loading...' }) {
  return <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><span className="spinner" />{label}</div>;
}
