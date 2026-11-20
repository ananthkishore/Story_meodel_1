import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, CircleDashed, Clock3, Layers3, Sparkles, Target, WandSparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState.jsx';
import { InlineLoader } from '../components/Loading.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import StoryCard from '../components/StoryCard.jsx';
import { projectsApi, storiesApi, getErrorMessage } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [allStories, setAllStories] = useState([]);
  const [recentStories, setRecentStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data } = await projectsApi.list();
        const items = data.data.projects;
        const storyLists = await Promise.all(items.map((project) => storiesApi.listForProject(project._id)));
        if (!active) return;
        setProjects(items);
        const projectById = new Map(items.map((project) => [project._id, project]));
        const stories = storyLists.flatMap((response) => response.data.data.stories);
        setAllStories(stories);
        setRecentStories(stories
          .map((story) => ({ ...story, project: projectById.get(story.projectId) }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3));
      } catch (error) { if (active) toast.error(getErrorMessage(error)); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const storyCount = projects.reduce((total, project) => total + (project.storyCount || 0), 0);
    const activeCount = allStories.filter((story) => story.status === 'In Progress').length;
    const completedCount = allStories.filter((story) => story.status === 'Done').length;
    return [
      { label: 'Total projects', value: projects.length, icon: Layers3, tone: 'stat-violet', detail: 'Your product workspaces' },
      { label: 'Stories generated', value: storyCount, icon: Sparkles, tone: 'stat-blue', detail: 'Across all your projects' },
      { label: 'In progress', value: activeCount, icon: CircleDashed, tone: 'stat-amber', detail: 'Keep your backlog moving' },
      { label: 'Completed', value: completedCount, icon: CheckCircle2, tone: 'stat-green', detail: 'Stories shipped' }
    ];
  }, [projects, allStories]);

  return (
    <div className="space-y-7">
      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="welcome-date"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{today}</div>
          <h1>Good to see you, {user?.name?.split(' ')[0]} <span className="wave">✦</span></h1>
          <p>Big idea on your mind? Let’s shape it into work your team can move on.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link to="/generate" className="button-white"><WandSparkles size={16} />Generate stories<ArrowRight size={15} /></Link><Link to="/projects" className="button-glass">Explore projects</Link></div>
        </div>
        <div className="welcome-visual" aria-hidden="true">
          <div className="welcome-orbit orbit-a" /><div className="welcome-orbit orbit-b" />
          <div className="welcome-doc"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-400" /><span className="h-2 w-16 rounded-full bg-slate-200" /></div><div className="mt-5 h-2 w-32 rounded-full bg-slate-100" /><div className="mt-2 h-2 w-24 rounded-full bg-slate-100" /><div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/80 p-3"><div className="flex items-center gap-2 text-[10px] font-semibold text-brand-600"><Sparkles size={11} />USER STORY</div><div className="mt-2 h-1.5 w-24 rounded-full bg-violet-200" /><div className="mt-1.5 h-1.5 w-16 rounded-full bg-violet-100" /></div></div>
          <span className="welcome-spark spark-a">✦</span><span className="welcome-spark spark-b">✧</span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone, detail }) => <article key={label} className="stat-card"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-muted">{label}</p><p className="mt-2 text-[26px] font-bold tracking-tight text-ink">{loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-slate-100" /> : value}</p></div><span className={`stat-icon ${tone}`}><Icon size={18} /></span></div><p className="mt-2 text-[11px] text-slate-400">{detail}</p></article>)}
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="space-y-6">
          <div className="section-heading"><div><p className="section-eyebrow">YOUR WORK</p><h2>Recent projects</h2></div><Link to="/projects" className="text-link">View all <ArrowUpRight size={15} /></Link></div>
          {loading ? <InlineLoader /> : projects.length ? <div className="grid gap-4 sm:grid-cols-2">{projects.slice(0, 4).map((project, index) => <ProjectCard key={project._id} project={project} index={index} />)}</div> : <EmptyState title="Your next great idea starts here" description="Create a product workspace, add a little context, and let AI help with the first draft." actionLabel="Create your first project" />}
          <div className="section-heading !mt-8"><div><p className="section-eyebrow">FRESH FROM THE WORKSPACE</p><h2>Recent stories</h2></div><Link to="/saved" className="text-link">View saved <ArrowUpRight size={15} /></Link></div>
          {loading ? <InlineLoader /> : recentStories.length ? <div className="space-y-3">{recentStories.map((story, index) => <div key={story._id}><Link className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700" to={`/projects/${story.projectId}`}>{story.project?.projectName || 'Open project'} <ArrowUpRight size={12} /></Link><StoryCard story={{ ...story, number: index + 1 }} readOnly /></div>)}</div> : <div className="recent-empty"><Target size={19} /><span>Your generated stories will show up here.</span><Link to="/generate">Create stories <ArrowRight size={14} /></Link></div>}
        </div>
        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="section-heading"><div><p className="section-eyebrow">QUICK ACTION</p><h2>Start with a prompt</h2></div></div>
          <div className="quick-generate">
            <div className="flex items-center justify-between"><span className="quick-icon"><Sparkles size={18} /></span><span className="quick-ai-badge">AI POWERED</span></div>
            <h3>Have a feature in mind?</h3>
            <p>Describe what you’re building. StoryCraft will find the roles, map the capabilities, and draft the stories.</p>
            <Link to="/generate" className="button-primary mt-5 w-full justify-center">Open story generator<ArrowRight size={15} /></Link>
            <div className="quick-footer"><Clock3 size={13} /> Usually takes less than a minute</div>
          </div>
          <div className="tip-card"><div className="flex items-center gap-2"><Sparkles size={15} className="text-brand-600" /><p className="text-xs font-semibold text-ink">A prompt tip</p></div><p className="mt-2 text-xs leading-5 text-muted">Mention who uses your product and what they’re trying to accomplish for more relevant stories.</p></div>
        </aside>
      </section>
    </div>
  );
}
