import { useMemo } from 'react';
import { TaskItem, TaskStatus, toPriority } from '../types';
import { useSpaceStore } from '@/store/useSpaceStore';

export const useFilteredTasks = (tasks: TaskItem[]) => {
  const filterQuery = useSpaceStore((s) => s.filterQuery);
  const showClosed = useSpaceStore((s) => s.showClosed);
  const filterPriority = useSpaceStore((s) => s.filterPriority);
  const filterStatus = useSpaceStore((s) => s.filterStatus);
  const filterTagId = useSpaceStore((s) => s.filterTagId);
  const filterAssigneeId = useSpaceStore((s) => s.filterAssigneeId);

  return useMemo(() => {
    return tasks.filter((t) => {
      // 1. "Closed" filter: when active, show only completed tasks (Complete status = 2).
      // When inactive (default), all statuses are shown.
      if (showClosed && t.status !== TaskStatus.Complete) {
        return false;
      }

      // 1b. Filter by assignee
      if (filterAssigneeId !== null) {
        const isAssigned = t.assignees?.some((u) => u.id === filterAssigneeId) ?? false;
        if (!isAssigned) {
          return false;
        }
      }

      // 2. Filter by status (explicit filter)
      if (filterStatus !== null && t.status !== filterStatus) {
        return false;
      }

      // 3. Filter by priority
      if (filterPriority !== null && toPriority(t.priority) !== filterPriority) {
        return false;
      }

      // 4. Filter by tag ID
      if (filterTagId !== null) {
        const hasTag = t.tags?.some((tag) => tag.id === filterTagId) ?? false;
        if (!hasTag) {
          return false;
        }
      }

      // 5. Filter by search query (title or description)
      if (filterQuery.trim()) {
        const query = filterQuery.toLowerCase().trim();
        const titleMatch = t.title.toLowerCase().includes(query);
        const descMatch = t.description?.toLowerCase().includes(query) ?? false;
        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filterQuery, showClosed, filterPriority, filterStatus, filterTagId, filterAssigneeId]);
};
