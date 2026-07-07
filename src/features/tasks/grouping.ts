import { TaskItem, Priority, PRIORITY_META, toPriority } from './types';
import type { GroupBy, GroupDir } from '@/store/useSpaceStore';

export interface TaskGroup {
  key: string;
  label: string;
  color: string;
  outline?: boolean;
  tasks: TaskItem[];
}

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

// Split top-level tasks into ordered groups for the chosen field/direction.
export function buildGroups(tasks: TaskItem[], groupBy: GroupBy, dir: GroupDir): TaskGroup[] {
  let groups: TaskGroup[];

  switch (groupBy) {
    case 'status': {
      const defs = [
        { key: 's0', label: 'TO DO', color: '#87909e', outline: true, status: 0 },
        { key: 's1', label: 'IN PROGRESS', color: '#2684ff', status: 1 },
        { key: 's2', label: 'COMPLETE', color: '#00c875', status: 2 },
      ];
      // Status always shows all columns (even empty ones).
      groups = defs.map((d) => ({ ...d, tasks: tasks.filter((t) => t.status === d.status) }));
      break;
    }

    case 'priority': {
      const order = [Priority.Urgent, Priority.High, Priority.Medium, Priority.Low];
      groups = order.map((p) => ({
        key: `p${p}`,
        label: PRIORITY_META[p].label.toUpperCase(),
        color: PRIORITY_META[p].color,
        tasks: tasks.filter((t) => toPriority(t.priority) === p),
      }));
      break;
    }

    case 'tags': {
      const byTag = new Map<number, TaskGroup>();
      const untagged: TaskItem[] = [];
      for (const t of tasks) {
        const tgs = t.tags ?? [];
        if (tgs.length === 0) { untagged.push(t); continue; }
        for (const tag of tgs) {
          if (!byTag.has(tag.id)) {
            byTag.set(tag.id, { key: `tag${tag.id}`, label: tag.name.toUpperCase(), color: tag.colorHex, tasks: [] });
          }
          byTag.get(tag.id)!.tasks.push(t);
        }
      }
      groups = [...byTag.values()].sort((a, b) => a.label.localeCompare(b.label));
      groups.push({ key: 'no-tag', label: 'NO TAGS', color: '#87909e', outline: true, tasks: untagged });
      break;
    }

    case 'dueDate': {
      const today = startOfToday();
      const overdue: TaskItem[] = [], due: TaskItem[] = [], upcoming: TaskItem[] = [], none: TaskItem[] = [];
      for (const t of tasks) {
        if (!t.dueDate) { none.push(t); continue; }
        const d = new Date(t.dueDate); d.setHours(0, 0, 0, 0);
        if (d.getTime() < today.getTime()) overdue.push(t);
        else if (d.getTime() === today.getTime()) due.push(t);
        else upcoming.push(t);
      }
      groups = [
        { key: 'overdue', label: 'OVERDUE', color: '#e2445c', tasks: overdue },
        { key: 'today', label: 'TODAY', color: '#2684ff', tasks: due },
        { key: 'upcoming', label: 'UPCOMING', color: '#00c875', tasks: upcoming },
        { key: 'no-date', label: 'NO DUE DATE', color: '#87909e', outline: true, tasks: none },
      ];
      break;
    }

    case 'assignee': {
      // No backend assignee field yet — everything is currently unassigned.
      groups = [{ key: 'unassigned', label: 'UNASSIGNED', color: '#87909e', outline: true, tasks }];
      break;
    }

    case 'none':
    default:
      groups = [{ key: 'all', label: 'ALL TASKS', color: '#87909e', outline: true, tasks }];
      break;
  }

  // Drop empty groups except for Status (whose columns should stay visible).
  if (groupBy !== 'status' && groupBy !== 'none') {
    groups = groups.filter((g) => g.tasks.length > 0);
  }

  return dir === 'desc' ? [...groups].reverse() : groups;
}
