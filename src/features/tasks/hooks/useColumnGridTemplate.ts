import { useSpaceStore } from '@/store/useSpaceStore';

// Grid template shared by the list table header and task rows.
// Tracks: name (2fr) + one fixed track per visible column, so hiding a
// column removes both its header cell and its value cell without
// misaligning the remaining columns.
export const useColumnGridTemplate = () => {
  const visibleColumns = useSpaceStore((s) => s.visibleColumns);
  const cols = ['2fr'];
  if (visibleColumns.assignee) cols.push('100px');
  if (visibleColumns.dueDate) cols.push('150px');
  if (visibleColumns.priority) cols.push('100px');
  return cols.join(' ');
};
