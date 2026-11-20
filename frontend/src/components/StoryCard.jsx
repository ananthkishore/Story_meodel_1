import { useState } from 'react';
import { ArrowDownUp, Check, ChevronDown, ChevronUp, Clipboard, LoaderCircle, Pencil, RefreshCw, Save, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../services/api.js';

const priorityClasses = { High: 'priority-high', Medium: 'priority-medium', Low: 'priority-low' };

export default function StoryCard({ story, onUpdate, onDelete, onRegenerate, readOnly = false }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState(false);
  const [draft, setDraft] = useState({});
  const value = (key) => draft[key] ?? story[key];

  const beginEdit = () => {
    setDraft({
      description: story.description,
      priority: story.priority,
      storyPoints: story.storyPoints,
      status: story.status,
      acceptanceCriteria: story.acceptanceCriteria.join('\n')
    });
    setEditing(true);
    setExpanded(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      await onUpdate(story._id, {
        description: draft.description,
        priority: draft.priority,
        storyPoints: Number(draft.storyPoints),
        status: draft.status,
        acceptanceCriteria: draft.acceptanceCriteria.split('\n').map((item) => item.trim()).filter(Boolean)
      });
      toast.success('Story updated.');
      setEditing(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally { setSaving(false); }
  };
  const runAction = async (action, successMessage) => {
    setWorking(true);
    try {
      const completed = await action();
      if (completed !== false) toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally { setWorking(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(story.description); toast.success('Story copied to clipboard.'); }
    catch { toast.error('Clipboard access is unavailable in this browser.'); }
  };

  return (
    <article className={`story-card ${expanded ? 'story-card-open' : ''}`}>
      <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="story-number">{story.number ? String(story.number).padStart(2, '0') : '•'}</div>
        <button className="min-w-0 flex-1 text-left" onClick={() => setExpanded((open) => !open)} aria-expanded={expanded}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="story-category">{story.category}</span>
            <span className={`priority-pill ${priorityClasses[story.priority]}`}>{story.priority}</span>
            <span className="status-chip">{story.status}</span>
          </div>
          <h3 className="mt-2 text-sm font-semibold leading-6 text-ink sm:text-[15px]">{story.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-muted">{story.description}</p>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <span className="hidden rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 sm:inline-flex">{story.storyPoints} pts</span>
          <button className="icon-button !h-8 !w-8" title="Copy story" onClick={copy}><Clipboard size={15} /></button>
          <button className="icon-button !h-8 !w-8" title="Expand story" onClick={() => setExpanded((open) => !open)}>{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
        </div>
      </div>
      {expanded && <div className="story-detail">
        <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
          <div>
            <div className="mb-2 flex items-center justify-between"><h4 className="detail-label">User story</h4>{editing ? <span className="text-[11px] font-medium text-brand-600">Editing</span> : null}</div>
            {editing
              ? <textarea className="field-control min-h-[86px] resize-y text-sm" value={value('description')} onChange={(event) => setDraft({ ...draft, description: event.target.value })} maxLength={2000} />
              : <p className="rounded-xl bg-white px-4 py-3 text-sm leading-6 text-slate-700">{story.description}</p>}
            <div className="mt-5 flex items-center justify-between"><h4 className="detail-label">Acceptance criteria <span className="text-slate-400">({story.acceptanceCriteria.length})</span></h4></div>
            {editing
              ? <textarea className="field-control mt-2 min-h-[120px] resize-y text-sm leading-6" placeholder="One criterion per line" value={value('acceptanceCriteria')} onChange={(event) => setDraft({ ...draft, acceptanceCriteria: event.target.value })} />
              : story.acceptanceCriteria.length
                ? <ul className="mt-2 space-y-2">{story.acceptanceCriteria.map((criterion, index) => <li key={`${index}-${criterion}`} className="flex gap-2.5 rounded-xl bg-white px-3.5 py-2.5 text-[13px] leading-5 text-slate-600"><Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />{criterion}</li>)}</ul>
                : <p className="mt-2 text-sm text-slate-400">No acceptance criteria were requested for this story.</p>}
            {story.dependencies?.length > 0 && <div className="mt-4"><h4 className="detail-label mb-2">Dependencies</h4><div className="flex flex-wrap gap-2">{story.dependencies.map((item) => <span className="dependency-chip" key={item}><ArrowDownUp size={12} />{item}</span>)}</div></div>}
            {story.tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{story.tags.map((tag) => <span key={tag} className="tag-chip">#{tag}</span>)}</div>}
          </div>
          <div className="space-y-4">
            <div><h4 className="detail-label mb-2">Workflow status</h4><select disabled={!editing} className="field-control !py-2.5 text-sm disabled:cursor-default disabled:bg-white" value={value('status')} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>{['Backlog', 'To Do', 'In Progress', 'Review', 'Done'].map((status) => <option key={status}>{status}</option>)}</select></div>
            <div><h4 className="detail-label mb-2">Priority</h4><select disabled={!editing} className="field-control !py-2.5 text-sm disabled:cursor-default disabled:bg-white" value={value('priority')} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>{['High', 'Medium', 'Low'].map((priority) => <option key={priority}>{priority}</option>)}</select></div>
            <div><h4 className="detail-label mb-2">Story points</h4><select disabled={!editing} className="field-control !py-2.5 text-sm disabled:cursor-default disabled:bg-white" value={value('storyPoints')} onChange={(event) => setDraft({ ...draft, storyPoints: event.target.value })}>{[1, 2, 3, 5, 8, 13].map((points) => <option key={points} value={points}>{points} points</option>)}</select></div>
            <p className="text-xs text-slate-400">Role · <span className="font-medium text-slate-600">{story.role}</span></p>
          </div>
        </div>
        {!readOnly && <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-4">
          <div className="flex gap-1.5">
            <button disabled={working} onClick={() => runAction(() => onRegenerate(story._id), 'Story regenerated.')} className="button-quiet"><RefreshCw size={14} className={working ? 'animate-spin' : ''} />Regenerate</button>
            <button disabled={working} onClick={() => runAction(() => onDelete(story._id), 'Story deleted.')} className="button-quiet !text-rose-600 hover:!bg-rose-50"><Trash2 size={14} />Delete</button>
          </div>
          {editing ? <div className="flex gap-2"><button onClick={() => setEditing(false)} className="button-secondary !py-2"><X size={14} />Cancel</button><button disabled={saving} onClick={save} className="button-primary !py-2">{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}Save changes</button></div>
            : <button onClick={beginEdit} className="button-secondary !py-2"><Pencil size={14} />Edit story</button>}
        </div>}
      </div>}
    </article>
  );
}
