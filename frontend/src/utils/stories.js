export const initialStoryFilters = { search: '', priority: 'All priorities', status: 'All statuses', category: 'All categories' };

export function filterAndSortStories(stories, filters, sort) {
  const query = filters.search.trim().toLowerCase();
  const matches = stories.filter((story) => {
    const text = `${story.title} ${story.role} ${story.description} ${story.category} ${(story.tags || []).join(' ')}`.toLowerCase();
    return (!query || text.includes(query)) &&
      (filters.priority === 'All priorities' || story.priority === filters.priority) &&
      (filters.status === 'All statuses' || story.status === filters.status) &&
      (filters.category === 'All categories' || story.category === filters.category);
  });
  const priorityRank = { High: 0, Medium: 1, Low: 2 };
  return matches.sort((a, b) => {
    if (sort === 'Priority') return priorityRank[a.priority] - priorityRank[b.priority];
    if (sort === 'Title') return a.title.localeCompare(b.title);
    if (sort === 'Oldest first') return new Date(a.createdAt) - new Date(b.createdAt);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}
