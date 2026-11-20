import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Download, FileJson2, LoaderCircle, Pencil, RefreshCw, Save, Search, Sparkles, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState.jsx';
import { InlineLoader } from '../components/Loading.jsx';
import StoryCard from '../components/StoryCard.jsx';
import StoryFilters from '../components/StoryFilters.jsx';
import { getErrorMessage, projectsApi, storiesApi } from '../services/api.js';
import { filterAndSortStories, initialStoryFilters } from '../utils/stories.js';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState(initialStoryFilters);
  const [sort, setSort] = useState('Newest first');
  const [draft, setDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await projectsApi.get(projectId);
      setProject(data.data.project);
      setStories(data.data.stories);
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  }, [projectId]);
  useEffect(() => { load(); }, [load]);
  const visible = useMemo(() => filterAndSortStories(stories, filters, sort), [stories, filters, sort]);
  const counts = useMemo(() => ({
    high: stories.filter((story) => story.priority === 'High').length,
    done: stories.filter((story) => story.status === 'Done').length,
    points: stories.reduce((total, story) => total + story.storyPoints, 0)
  }), [stories]);

  const updateStory = async (id, updates) => {
    const { data } = await storiesApi.update(id, updates);
    setStories((current) => current.map((story) => story._id === id ? data.data.story : story));
  };
  const deleteStory = async (id) => {
    const story = stories.find((item) => item._id === id);
    if (!window.confirm(`Delete "${story?.title || 'this story'}"?`)) return false;
    await storiesApi.delete(id);
    setStories((current) => current.filter((item) => item._id !== id));
    return true;
  };
  const regenerateStory = async (id) => {
    const { data } = await storiesApi.regenerate(id);
    setStories((current) => current.map((story) => story._id === id ? data.data.story : story));
  };
  const regenerateAll = async () => {
    if (!window.confirm('Replace all current stories with a newly generated set? Existing story edits will be lost.')) return;
    setGenerating(true);
    try {
      const { data } = await storiesApi.generate({ projectId, count: Math.min(Math.max(stories.length || 8, 3), 20), replaceExisting: true });
      setProject(data.data.project);
      setStories(data.data.stories);
      toast.success('A fresh set of stories is ready.');
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setGenerating(false); }
  };
  const saveProject = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await projectsApi.update(projectId, { ...draft, requirements: draft.requirements.split(/\r?\n/).map((value) => value.trim()).filter(Boolean) });
      setProject(data.data.project);
      setEditing(false);
      toast.success('Project details saved.');
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setSaving(false); }
  };
  const startEditing = () => {
    setDraft({ projectName: project.projectName, description: project.description, targetUsers: project.targetUsers || '', industry: project.industry || '', requirements: (project.requirements || []).join('\n') });
    setEditing(true);
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ project: project.projectName, exportedAt: new Date().toISOString(), stories: stories.map(exportableStory) }, null, 2)], { type: 'application/json' });
    download(blob, `${slug(project.projectName)}-stories.json`);
  };
  const exportCsv = () => {
    const headers = ['Title', 'Role', 'Description', 'Category', 'Priority', 'Story Points', 'Status', 'Acceptance Criteria', 'Dependencies', 'Tags'];
    const rows = stories.map((story) => [story.title, story.role, story.description, story.category, story.priority, story.storyPoints, story.status, story.acceptanceCriteria.join(' | '), story.dependencies.join(' | '), story.tags.join(' | ')]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    download(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), `${slug(project.projectName)}-stories.csv`);
  };

  if (loading) return <InlineLoader label="Loading project..." />;
  if (!project) return <EmptyState title="Project not found" description="It may have been deleted, or you may not have access to it." actionLabel="View projects" actionTo="/projects" />;

  return <div className="space-y-6">
    <div><Link to="/projects" className="back-link"><ArrowLeft size={15} />All projects</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[220px] flex-1">
          {editing ? <input className="field-control max-w-xl !text-xl !font-bold" value={draft.projectName} onChange={(event) => setDraft({ ...draft, projectName: event.target.value })} /> : <h1 className="page-title">{project.projectName}</h1>}
          {editing ? <textarea className="field-control mt-3 max-w-3xl resize-y" rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /> : <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{project.description}</p>}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400"><span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-600">{project.industry || 'Product'}</span><span className="inline-flex items-center gap-1"><CalendarDays size={13} />Updated {new Date(project.updatedAt).toLocaleDateString()}</span></div>
        </div>
        {editing ? <form onSubmit={saveProject} className="flex gap-2"><button type="button" className="button-secondary" onClick={() => setEditing(false)}><X size={14} />Cancel</button><button disabled={saving} className="button-primary">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}Save details</button></form>
          : <div className="flex flex-wrap gap-2"><button className="button-secondary" onClick={startEditing}><Pencil size={15} />Edit project</button><button className="button-secondary" onClick={exportJson} disabled={!stories.length}><FileJson2 size={15} />Export JSON</button><button className="button-secondary" onClick={exportCsv} disabled={!stories.length}><Download size={15} />Export CSV</button></div>}
      </div>
      {editing && <div className="mt-4 grid max-w-3xl gap-3 sm:grid-cols-2"><label className="form-label">Target users<input className="field-control mt-1.5" value={draft.targetUsers} onChange={(event) => setDraft({ ...draft, targetUsers: event.target.value })} /></label><label className="form-label">Industry<input className="field-control mt-1.5" value={draft.industry} onChange={(event) => setDraft({ ...draft, industry: event.target.value })} /></label><label className="form-label sm:col-span-2">Features / requirements<textarea className="field-control mt-1.5" rows={3} value={draft.requirements} onChange={(event) => setDraft({ ...draft, requirements: event.target.value })} /></label></div>}
    </div>

    <div className="grid gap-3 sm:grid-cols-3"><div className="mini-stat"><span className="mini-stat-icon bg-brand-50 text-brand-600"><Sparkles size={17} /></span><span><b>{stories.length}</b><small>Total stories</small></span></div><div className="mini-stat"><span className="mini-stat-icon bg-rose-50 text-rose-500"><ArrowRight size={17} /></span><span><b>{counts.high}</b><small>High priority</small></span></div><div className="mini-stat"><span className="mini-stat-icon bg-emerald-50 text-emerald-600"><Check size={17} /></span><span><b>{counts.done} <em>/ {stories.length}</em></b><small>Completed · {counts.points} pts total</small></span></div></div>

    <section>
      <div className="section-heading"><div><p className="section-eyebrow">PROJECT BACKLOG</p><h2>User stories <span className="heading-count">{stories.length}</span></h2></div><div className="flex flex-wrap gap-2"><Link className="button-secondary" to={`/generate?projectId=${projectId}`}><Sparkles size={15} />Add stories</Link><button className="button-primary" disabled={generating} onClick={regenerateAll}>{generating ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}Regenerate all</button></div></div>
      {stories.length > 0 && <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3"><StoryFilters stories={stories} value={filters} onChange={setFilters} /><label className="sort-control"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Newest first</option><option>Oldest first</option><option>Priority</option><option>Title</option></select><ChevronDown size={13} /></label></div>}
      {stories.length === 0 ? <EmptyState title="Your backlog starts with a story" description="Create a first set from your project context. Generated stories are saved automatically." actionLabel="Generate stories" actionTo={`/generate?projectId=${projectId}`} />
        : visible.length ? <div className="space-y-3">{visible.map((story, index) => <StoryCard key={story._id} story={{ ...story, number: index + 1 }} onUpdate={updateStory} onDelete={deleteStory} onRegenerate={regenerateStory} />)}</div>
          : <EmptyState title="No stories match these filters" description="Try another search or clear the current filters." icon={Search} />}
    </section>
    {project.generationHistory?.length > 0 && <section className="history-card"><div className="section-heading"><div><p className="section-eyebrow">ACTIVITY</p><h2>Generation history</h2></div><ChevronDown size={15} className="text-slate-400" /></div><div className="mt-4 space-y-3">{[...project.generationHistory].reverse().slice(0, 5).map((item, index) => <div key={`${item.generatedAt}-${index}`} className="flex items-center gap-3 text-xs"><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600"><Sparkles size={13} /></span><span className="flex-1 text-slate-600">Generated <b>{item.storyCount}</b> {item.storyCount === 1 ? 'story' : 'stories'}</span><time className="text-slate-400">{new Date(item.generatedAt).toLocaleString()}</time></div>)}</div></section>}
  </div>;
}

function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project'; }
function exportableStory(story) {
  const { _id, title, role, description, category, priority, storyPoints, acceptanceCriteria, dependencies, tags, status, createdAt, updatedAt } = story;
  return { id: _id, title, role, description, category, priority, storyPoints, acceptanceCriteria, dependencies, tags, status, createdAt, updatedAt };
}
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
