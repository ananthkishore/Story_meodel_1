import { useEffect, useMemo, useState } from 'react';
import { Bookmark, ChevronDown, Download, FileJson2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState.jsx';
import { InlineLoader } from '../components/Loading.jsx';
import StoryCard from '../components/StoryCard.jsx';
import StoryFilters from '../components/StoryFilters.jsx';
import { getErrorMessage, projectsApi, storiesApi } from '../services/api.js';
import { filterAndSortStories, initialStoryFilters } from '../utils/stories.js';

export default function SavedStoriesPage() {
  const [stories, setStories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initialStoryFilters);
  const [sort, setSort] = useState('Newest first');
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data } = await projectsApi.list();
        const items = data.data.projects;
        const responses = await Promise.all(items.map((project) => storiesApi.listForProject(project._id)));
        if (!active) return;
        setProjects(items);
        const projectById = new Map(items.map((project) => [project._id, project]));
        setStories(responses.flatMap((response) => response.data.data.stories).map((story) => ({ ...story, project: projectById.get(story.projectId) })));
      } catch (error) { if (active) toast.error(getErrorMessage(error)); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);
  const visible = useMemo(() => filterAndSortStories(stories, filters, sort), [stories, filters, sort]);
  const updateStory = async (id, updates) => {
    const { data } = await storiesApi.update(id, updates);
    setStories((current) => current.map((story) => story._id === id ? { ...story, ...data.data.story } : story));
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
    setStories((current) => current.map((story) => story._id === id ? { ...story, ...data.data.story } : story));
  };
  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), projects: projects.map((project) => ({ projectName: project.projectName, stories: stories.filter((story) => story.projectId === project._id).map(exportableStory) })) }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'storycraft-saved-stories.json'; anchor.click(); URL.revokeObjectURL(url);
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="section-eyebrow">YOUR LIBRARY</p><h1 className="page-title mt-1">Saved stories</h1><p className="mt-2 text-sm leading-6 text-muted">Every generated story, together in one place.</p></div><button disabled={!stories.length} onClick={exportAll} className="button-secondary"><FileJson2 size={15} />Export all as JSON</button></div>
    {!loading && stories.length > 0 && <div className="library-summary"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600"><Bookmark size={17} /></span><span className="flex-1 text-sm font-medium text-slate-600"><b className="text-ink">{stories.length}</b> {stories.length === 1 ? 'story' : 'stories'} across <b className="text-ink">{projects.length}</b> {projects.length === 1 ? 'project' : 'projects'}</span><Download size={15} className="text-slate-400" /></div>}
    {stories.length > 0 && !loading && <div className="flex flex-wrap items-center justify-between gap-3"><StoryFilters stories={stories} value={filters} onChange={setFilters} /><label className="sort-control"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Newest first</option><option>Oldest first</option><option>Priority</option><option>Title</option></select><ChevronDown size={13} /></label></div>}
    {loading ? <InlineLoader label="Gathering your stories..." /> : visible.length ? <div className="space-y-3">{visible.map((story, index) => <div key={story._id}><Link className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700" to={`/projects/${story.projectId}`}>{story.project?.projectName || 'Open project'} <span className="text-slate-300">/</span> {story.category}</Link><StoryCard story={{ ...story, number: index + 1 }} onUpdate={updateStory} onDelete={deleteStory} onRegenerate={regenerateStory} /></div>)}</div>
      : stories.length ? <EmptyState title="No stories match your filters" description="Try a different search, priority, status, or category." icon={Search} />
        : <EmptyState title="Your story library is ready" description="Generate stories for a project and they’ll be saved here automatically." actionLabel="Generate stories" />}
  </div>;
}

function exportableStory(story) {
  const { _id, title, role, description, category, priority, storyPoints, acceptanceCriteria, dependencies, tags, status, createdAt, updatedAt } = story;
  return { id: _id, title, role, description, category, priority, storyPoints, acceptanceCriteria, dependencies, tags, status, createdAt, updatedAt };
}
