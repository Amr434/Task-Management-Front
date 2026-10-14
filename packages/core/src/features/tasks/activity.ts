import type { Dictionary } from '../../i18n/dictionaries/en';
import { TaskActivityType, type TaskActivity } from './types';

// Keys of the dictionary whose value is plain text (some entries are nested).
type TextKey = { [K in keyof Dictionary]: Dictionary[K] extends string ? K : never }[keyof Dictionary];

const STATUS_KEYS: Record<string, TextKey> = {
  ToDo: 'statusToDo',
  InProgress: 'statusInProgress',
  Complete: 'statusComplete',
};

// The backend's "Medium" is shown as "Normal" everywhere in the UI.
const PRIORITY_KEYS: Record<string, TextKey> = {
  Low: 'priorityLow',
  Medium: 'priorityNormal',
  High: 'priorityHigh',
  Urgent: 'priorityUrgent',
};

const label = (t: Dictionary, keys: Record<string, TextKey>, value?: string | null): string =>
  (value && keys[value] ? t[keys[value]] : value) ?? '';

// yyyy-MM-dd, read as a calendar date (not UTC midnight, which can show as the
// previous day west of Greenwich).
const dateLabel = (value: string | null | undefined, locale?: string) => {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
};

const fill = (template: string, from: string, to: string) =>
  template.replace('{from}', from).replace('{to}', to);

/**
 * What happened, as a phrase to follow the person's name:
 * "changed status from TO DO to IN PROGRESS".
 */
export function describeActivity(a: TaskActivity, t: Dictionary, locale?: string): string {
  const from = a.oldValue ?? '';
  const to = a.newValue ?? '';

  switch (a.type) {
    case TaskActivityType.Created:
      return t.historyCreated;
    case TaskActivityType.TitleChanged:
      return fill(t.historyRenamed, from, to);
    case TaskActivityType.DescriptionChanged:
      return t.historyDescription;
    case TaskActivityType.StatusChanged:
      return fill(t.historyStatus, label(t, STATUS_KEYS, from), label(t, STATUS_KEYS, to));
    case TaskActivityType.PriorityChanged:
      return fill(t.historyPriority, label(t, PRIORITY_KEYS, from), label(t, PRIORITY_KEYS, to));
    case TaskActivityType.DueDateChanged:
      if (!to) return t.historyDueRemoved;
      if (!from) return fill(t.historyDueSet, '', dateLabel(to, locale));
      return fill(t.historyDueChanged, dateLabel(from, locale), dateLabel(to, locale));
    case TaskActivityType.AssigneeAdded:
      return fill(t.historyAssigned, from, to);
    case TaskActivityType.AssigneeRemoved:
      return fill(t.historyUnassigned, from, to);
    case TaskActivityType.TagAdded:
      return fill(t.historyTagAdded, from, to);
    case TaskActivityType.TagRemoved:
      return fill(t.historyTagRemoved, from, to);
    case TaskActivityType.MovedToProject:
      return fill(t.historyMoved, from, to);
    case TaskActivityType.CommentAdded:
      return fill(t.historyCommentAdded, from, to);
    case TaskActivityType.CommentDeleted:
      return fill(t.historyCommentDeleted, from, to);
    case TaskActivityType.CommentAssigned:
      return fill(from ? t.historyCommentReassigned : t.historyCommentAssigned, from, to);
    case TaskActivityType.CommentUnassigned:
      return fill(t.historyCommentUnassigned, from, to);
    case TaskActivityType.CommentResolved:
      return fill(t.historyCommentResolved, from, to);
    case TaskActivityType.CommentReopened:
      return fill(t.historyCommentReopened, from, to);
    case TaskActivityType.AttachmentAdded:
      return fill(t.historyAttachmentAdded, from, to);
    case TaskActivityType.AttachmentDeleted:
      return fill(t.historyAttachmentDeleted, from, to);
    default:
      return '';
  }
}
