import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FolderKanban, Plus, Search, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState.jsx';
import { InlineLoader } from '../components/Loading.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import { getErrorMessage, projectsApi } from '../services/api.js';

export default function ProjectsPage() {
  const [params, setParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(params.get('search') || '');
  const load = async () => {
    setLoading(true);
    try { const { data } = await projectsApi.list(); setProjects(data.data.projects); }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => projects.filter((project) => `${project.projectName} ${project.description} ${project.industry}`.toLowerCase().includes(query.toLowerCase())), [projects, query]);
  const deleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.projectName}" and all of its stories? This cannot be undone.`)) return;
    try { await projectsApi.delete(project._id); setProjects((current) => current.filter((item) => item._id !== project._id)); toast.success('Project deleted.'); }
    catch (error) { toast.error(getErrorMessage(error)); }
  };
  const onSearch = (event) => {
    setQuery(event.target.value);
    if (event.target.value) setParams({ search: event.target.value }, { replace: true });
    else setParams({}, { replace: true });
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="section-eyebrow">YOUR WORKSPACE</p><h1 className="page-title mt-1">My projects</h1><p className="mt-2 text-sm leading-6 text-muted">Ideas, organized into clear product backlogs.</p></div><Link to="/generate" className="button-primary"><Plus size={16} />New project</Link></div>
    <div className="project-toolbar"><div className="flex items-center gap-2 text-sm font-medium text-slate-500"><FolderKanban size={16} /><span>{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span></div><label className="filter-search !max-w-[300px]"><Search size={16} /><input placeholder="Search projects" value={query} onChange={onSearch} /><kbd>⌕</kbd></label></div>
    {loading ? <InlineLoader label="Loading projects..." /> : visible.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map((project, index) => <ProjectCard key={project._id} project={project} index={index} onDelete={deleteProject} />)}</div>
      : projects.length ? <EmptyState title="No projects match that search" description="Try a different name or clear the search." icon={Search} />
        : <div className="projects-empty"><EmptyState title="A fresh workspace, ready for ideas" description="Create your first project and turn your product context into stories your team can use." actionLabel="Create a project" /><div className="mt-4 flex justify-center gap-2 text-xs text-slate-400"><Sparkles size={14} className="text-brand-500" />Every story is saved to your account<ArrowRight size={13} /></div></div>}
  </div>;
}
