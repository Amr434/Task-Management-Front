export interface Tag {
  id: number;
  name: string;
  colorHex: string;
}

// Mirrors backend Task_Management.Domain.Enums.PriorityLevel
export enum Priority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  [Priority.Low]: { label: 'Low', color: '#87909e' },
  [Priority.Medium]: { label: 'Normal', color: '#2684ff' },
  [Priority.High]: { label: 'High', color: '#ffb800' },
  [Priority.Urgent]: { label: 'Urgent', color: '#e2445c' },
};

// Normalise any incoming priority (number, numeric string, enum name, or a legacy
// out-of-range value like the old hardcoded `4`) into a valid Priority.
export function toPriority(value: unknown): Priority {
  if (typeof value === 'number' && value in PRIORITY_META) return value as Priority;
  if (typeof value === 'string') {
    const asNum = Number(value);
    if (!Number.isNaN(asNum) && asNum in PRIORITY_META) return asNum as Priority;
    const byName = (Priority as Record<string, unknown>)[value];
    if (typeof byName === 'number') return byName as Priority;
  }
  return Priority.Low;
}

export const priorityMeta = (value: unknown) => PRIORITY_META[toPriority(value)];

// Mirrors the backend TaskStatusLevel enum (to be added server-side).
// Optional on TaskItem until the API ships the column.
export enum TaskStatus {
  ToDo = 0,
  InProgress = 1,
  Complete = 2,
}

export interface TaskItem {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  order: number;
  projectId: number;
  parentTaskId?: number;
  status: TaskStatus;
  tags?: Tag[];
}
