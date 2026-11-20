import { ArrowUpRight, CalendarDays, Layers3, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

const colors = ['project-violet', 'project-blue', 'project-rose', 'project-amber'];

export default function ProjectCard({ project, index = 0, onDelete }) {
  const date = new Date(project.updatedAt || project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <article className="project-card">
      <div className={`project-card-art ${colors[index % colors.length]}`}>
        <span className="project-art-icon"><Layers3 size={21} /></span>
        <span className="project-art-orbit orbit-one" /><span className="project-art-orbit orbit-two" />
        <Link to={`/projects/${project._id}`} className="project-open" aria-label={`Open ${project.projectName}`}><ArrowUpRight size={17} /></Link>
        {onDelete && <button className="project-menu" aria-label="Delete project" onClick={() => onDelete(project)}><MoreHorizontal size={18} /></button>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2"><Link to={`/projects/${project._id}`} className="truncate text-sm font-semibold text-ink hover:text-brand-600">{project.projectName}</Link><span className="project-industry">{project.industry || 'Product'}</span></div>
        <p className="mt-1.5 line-clamp-2 min-h-[40px] text-xs leading-5 text-muted">{project.description}</p>
        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-400"><span className="inline-flex items-center gap-1.5"><Layers3 size={13} />{project.storyCount ?? project.stories?.length ?? 0} stories</span><span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{date}</span></div>
      </div>
    </article>
  );
}
