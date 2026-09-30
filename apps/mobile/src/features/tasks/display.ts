import { TaskStatus } from '@task/core/features/tasks/types';

// The web app renders status from CSS classes; mobile needs the same three
// states as plain values. Colours match the web board columns.
export const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  [TaskStatus.ToDo]: { label: 'To Do', color: '#87909e' },
  [TaskStatus.InProgress]: { label: 'In Progress', color: '#2684ff' },
  [TaskStatus.Complete]: { label: 'Complete', color: '#00c875' },
};

export const STATUS_ORDER: TaskStatus[] = [TaskStatus.ToDo, TaskStatus.InProgress, TaskStatus.Complete];

/** Tapping the status dot walks To Do -> In Progress -> Complete -> To Do. */
export function nextStatus(current: TaskStatus): TaskStatus {
  const i = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
}

/**
 * Dates are anchored at local noon before being sent.
 *
 * The API echoes DateTime back without offset information, so a date stored at
 * local midnight lands on the previous day once Egypt's UTC+3 is applied. The
 * web app hit this and fixed it the same way — do not switch to toISOString()
 * on a midnight date.
 */
export function atNoon(date: Date): string {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Short human label for a due date, plus whether it is in the past. */
export function formatDueDate(value?: string): { label: string; overdue: boolean } | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const today = startOfDay(new Date());
  const day = startOfDay(date);
  const diffDays = Math.round((day.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return { label: 'Today', overdue: false };
  if (diffDays === 1) return { label: 'Tomorrow', overdue: false };
  if (diffDays === -1) return { label: 'Yesterday', overdue: true };

  const label = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return { label, overdue: diffDays < 0 };
}
