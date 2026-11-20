import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function StoryFilters({ stories, value, onChange }) {
  const categories = [...new Set(stories.map((story) => story.category).filter(Boolean))].sort();
  const hasFilters = value.search || value.priority !== 'All priorities' || value.status !== 'All statuses' || value.category !== 'All categories';
  return (
    <div className="story-filters">
      <label className="filter-search"><Search size={16} /><input value={value.search} onChange={(event) => onChange({ ...value, search: event.target.value })} placeholder="Search stories..." /><kbd>⌕</kbd></label>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Filter by priority" className="filter-select" value={value.priority} onChange={(event) => onChange({ ...value, priority: event.target.value })}><option>All priorities</option>{['High', 'Medium', 'Low'].map((priority) => <option key={priority}>{priority}</option>)}</select>
        <select aria-label="Filter by status" className="filter-select" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}><option>All statuses</option>{['Backlog', 'To Do', 'In Progress', 'Review', 'Done'].map((status) => <option key={status}>{status}</option>)}</select>
        <select aria-label="Filter by category" className="filter-select max-w-[160px]" value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value })}><option>All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
      </div>
      {hasFilters && <button className="clear-filters" onClick={() => onChange({ search: '', priority: 'All priorities', status: 'All statuses', category: 'All categories' })}><X size={13} />Clear</button>}
      {!hasFilters && <span className="hidden items-center gap-1 text-[11px] text-slate-400 lg:inline-flex"><SlidersHorizontal size={13} />Filter stories</span>}
    </div>
  );
}
