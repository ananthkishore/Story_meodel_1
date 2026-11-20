import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Lightbulb, LoaderCircle, Sparkles, WandSparkles } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectsApi, storiesApi, getErrorMessage } from '../services/api.js';
import { InlineLoader } from '../components/Loading.jsx';

const initialForm = { projectName: '', description: '', targetUsers: '', requirements: '', industry: '' };
const initialSettings = { count: 8, priority: 'Balanced', complexity: 'Mixed', format: 'Standard user story', includeAcceptanceCriteria: true, includeEdgeCases: false };

export default function GeneratePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('projectId');
  const [form, setForm] = useState(initialForm);
  const [settings, setSettings] = useState(initialSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [loadingProject, setLoadingProject] = useState(Boolean(projectId));
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    projectsApi.get(projectId).then(({ data }) => {
      if (!active) return;
      const project = data.data.project;
      setForm({ projectName: project.projectName, description: project.description, targetUsers: project.targetUsers || '', requirements: (project.requirements || []).join('\n'), industry: project.industry || '' });
    }).catch((error) => { if (active) toast.error(getErrorMessage(error)); })
      .finally(() => { if (active) setLoadingProject(false); });
    return () => { active = false; };
  }, [projectId]);

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (form.projectName.trim().length < 2) return toast.error('Project name must be at least 2 characters.');
    if (form.description.trim().length < 10) return toast.error('Add a little more context (at least 10 characters).');
    setGenerating(true);
    try {
      const payload = {
        ...form,
        ...(projectId ? { projectId } : {}),
        requirements: form.requirements.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
        ...settings
      };
      const { data } = await storiesApi.generate(payload);
      const project = data.data.project;
      toast.success(`${data.data.stories.length} stories generated and saved.`);
      navigate(`/projects/${project._id}`, { state: { generated: true } });
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setGenerating(false); }
  };

  if (loadingProject) return <InlineLoader label="Opening project..." />;

  return (
    <div className="mx-auto max-w-[1080px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><Link to={projectId ? `/projects/${projectId}` : '/'} className="back-link"><ArrowLeft size={15} />{projectId ? 'Back to project' : 'Dashboard'}</Link><p className="section-eyebrow mt-5">AI STORY WORKSPACE</p><h1 className="page-title mt-1">Generate user stories</h1><p className="mt-2 text-sm leading-6 text-muted">Start with the problem and the people. We’ll shape the first draft.</p></div><div className="hidden items-center gap-2 rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-medium text-slate-500 sm:flex"><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600"><Sparkles size={14} /></span>Context-aware generation</div></div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={submit} className="workspace-card">
          <div className="form-section-head"><span className="step-number">01</span><div><h2>Tell us what you’re building</h2><p>The more context you share, the more useful your stories become.</p></div></div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="form-label">Project name <span className="text-rose-500">*</span><input className="field-control mt-2" required minLength={2} maxLength={120} value={form.projectName} onChange={setField('projectName')} placeholder="e.g. Evently ticketing platform" /></label>
            <label className="form-label">Industry <span className="font-normal text-slate-400">(optional)</span><input className="field-control mt-2" maxLength={120} value={form.industry} onChange={setField('industry')} placeholder="e.g. Events & entertainment" /></label>
          </div>
          <label className="form-label mt-5 block">Project description <span className="text-rose-500">*</span><span className="relative mt-2 block"><textarea className="field-control min-h-[164px] resize-y !leading-6" required minLength={10} maxLength={10000} value={form.description} onChange={setField('description')} placeholder="Describe the product, the problem it solves, and what users need to accomplish. For example: an event ticketing platform where attendees discover events, choose seats, pay securely, and get booking confirmations. Organizers manage listings and track sales." /><span className="absolute bottom-3 right-3 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-slate-400">{form.description.length}/10,000</span></span></label>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="form-label">Target users <span className="font-normal text-slate-400">(optional)</span><input className="field-control mt-2" maxLength={2000} value={form.targetUsers} onChange={setField('targetUsers')} placeholder="e.g. Attendees, event organizers" /><span className="field-hint">Who will use this product?</span></label>
            <label className="form-label">Main features & requirements <span className="font-normal text-slate-400">(optional)</span><textarea className="field-control mt-2 min-h-[85px] resize-y !py-3" value={form.requirements} onChange={setField('requirements')} placeholder="One feature per line&#10;Event discovery&#10;Secure checkout" /><span className="field-hint">One item per line</span></label>
          </div>
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/80">
            <button type="button" onClick={() => setShowSettings((show) => !show)} className="flex w-full items-center justify-between bg-white px-4 py-3.5 text-left hover:bg-slate-50/60"><span className="flex items-center gap-2.5 text-sm font-semibold text-ink"><span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-500"><WandSparkles size={15} /></span>Generation settings <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">Optional</span></span><ChevronDown size={16} className={`text-slate-400 transition ${showSettings ? 'rotate-180' : ''}`} /></button>
            {showSettings && <div className="grid gap-4 border-t border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2">
              <label className="form-label">Number of stories<select className="field-control mt-2" value={settings.count} onChange={(event) => setSettings({ ...settings, count: Number(event.target.value) })}>{[3, 5, 8, 10, 12, 15, 20].map((number) => <option key={number} value={number}>{number} stories</option>)}</select></label>
              <label className="form-label">Priority focus<select className="field-control mt-2" value={settings.priority} onChange={(event) => setSettings({ ...settings, priority: event.target.value })}>{['Balanced', 'High', 'Medium', 'Low'].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="form-label">Story complexity<select className="field-control mt-2" value={settings.complexity} onChange={(event) => setSettings({ ...settings, complexity: event.target.value })}>{['Mixed', 'Simple', 'Moderate', 'Complex'].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="form-label">Story format<select className="field-control mt-2" value={settings.format} onChange={(event) => setSettings({ ...settings, format: event.target.value })}>{['Standard user story', 'Concise', 'Detailed'].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="toggle-row"><input type="checkbox" checked={settings.includeAcceptanceCriteria} onChange={(event) => setSettings({ ...settings, includeAcceptanceCriteria: event.target.checked })} /><span><b>Acceptance criteria</b><small>Include testable Given / When / Then conditions</small></span></label>
              <label className="toggle-row"><input type="checkbox" checked={settings.includeEdgeCases} onChange={(event) => setSettings({ ...settings, includeEdgeCases: event.target.checked })} /><span><b>Consider edge cases</b><small>Include exceptional and boundary scenarios</small></span></label>
            </div>}
          </div>
          <div className="mt-6 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center"><p className="flex items-center gap-2 text-xs text-slate-400"><Check size={14} className="text-emerald-500" />Your work is saved to your private workspace</p><button disabled={generating} className="button-primary justify-center !px-5 !py-3">{generating ? <><LoaderCircle size={16} className="animate-spin" />Generating stories...</> : <><Sparkles size={16} />Generate user stories<ArrowRight size={15} /></>}</button></div>
        </form>
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className={`generation-preview ${generating ? 'generation-active' : ''}`}>
            <div className="flex items-center justify-between"><span className="generation-orb"><Sparkles size={18} /></span><span className="quick-ai-badge">STORYCRAFT AI</span></div>
            {generating ? <><div className="mt-6"><div className="generation-wave"><i /><i /><i /><i /><i /><i /><i /></div><h3 className="mt-4 text-base font-semibold text-ink">Finding the story in your idea</h3><p className="mt-2 text-xs leading-5 text-muted">Reading your context, identifying user roles, and shaping distinct capabilities. This can take up to a minute.</p></div><div className="mt-5 space-y-2.5"><div className="skeleton-line w-full" /><div className="skeleton-line w-4/5" /><div className="skeleton-line w-3/5" /></div></>
              : <><h3 className="mt-5 text-base font-semibold text-ink">A clearer backlog begins with context</h3><p className="mt-2 text-xs leading-5 text-muted">StoryCraft uses your description to understand the domain, user roles, goals, and how features relate—then writes stories grounded in what you shared.</p><div className="mt-5 space-y-3">{['Understands your product domain', 'Finds the people and their needs', 'Creates testable acceptance criteria'].map((label) => <div key={label} className="flex items-center gap-2 text-xs font-medium text-slate-600"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check size={12} /></span>{label}</div>)}</div></>}
          </div>
          <div className="tip-card"><div className="flex items-center gap-2"><Lightbulb size={15} className="text-amber-500" /><p className="text-xs font-semibold text-ink">Pro tip</p></div><p className="mt-2 text-xs leading-5 text-muted">Include the problem users have—not just the feature you want. Outcomes make stories more meaningful.</p></div>
        </aside>
      </div>
    </div>
  );
}
