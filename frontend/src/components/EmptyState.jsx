import { ArrowRight, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ title, description, actionLabel, actionTo = '/generate', icon: Icon = FolderOpen }) {
  return (
    <div className="empty-state">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon size={22} /></span>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {actionLabel && <Link to={actionTo} className="button-primary mt-5">{actionLabel}<ArrowRight size={16} /></Link>}
    </div>
  );
}
