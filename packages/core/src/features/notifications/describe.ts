import type { Dictionary } from '../../i18n/dictionaries/en';
import { describeActivity } from '../tasks/activity';
import { userDisplayName, type User } from '../tasks/types';
import { InvitationStatus, InvitationTargetType, type Invitation } from '../invitations/types';
import { NotificationType, type NotificationItem } from './types';

// Where tapping a notification leads.
export type NotificationTarget =
  | { kind: 'task'; taskId: number; projectId: number }
  | { kind: 'path'; path: string };

export interface NotificationView {
  // Whose avatar to show (none for reminders and invitations).
  person?: User | null;
  title: string;
  body?: string;
  target: NotificationTarget;
}

const fill = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(value), template);

// yyyy-MM-dd as a calendar date in the user's language.
const dateLabel = (value: string, locale?: string) => {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
};

const inviteTarget = (inv: Invitation, t: Dictionary) =>
  fill(inv.targetType === InvitationTargetType.Space ? t.notifSpace : t.notifProject, { name: inv.targetName });

const invitationPath = (inv: Invitation) => {
  if (inv.targetType === InvitationTargetType.Space && inv.spaceId) return `/spaces/${inv.spaceId}`;
  if (inv.projectId) return `/projects/${inv.projectId}${inv.spaceId ? `?spaceId=${inv.spaceId}` : ''}`;
  return '/';
};

/** Text, avatar and destination for one saved notification, in the user's language. */
export function describeNotification(n: NotificationItem, t: Dictionary, locale?: string): NotificationView {
  const name = (u?: User | null) => (u ? userDisplayName(u) : t.someone);

  switch (n.type) {
    case NotificationType.TaskChanged: {
      const { activity, taskTitle, taskId, projectId } = n.payload;
      return {
        person: activity.user,
        title: taskTitle,
        body: `${name(activity.user)} ${describeActivity(activity, t, locale)}`,
        target: { kind: 'task', taskId, projectId },
      };
    }
    case NotificationType.CommentAdded:
    case NotificationType.Mentioned: {
      const c = n.payload;
      const template = n.type === NotificationType.Mentioned ? t.notifMentioned : t.notifCommented;
      return {
        person: c.author,
        title: fill(template, { name: name(c.author), task: c.taskTitle ?? '' }),
        body: c.text,
        target: { kind: 'task', taskId: c.taskItemId, projectId: c.projectId },
      };
    }
    case NotificationType.InvitationReceived: {
      const inv = n.payload;
      return {
        title: fill(t.notifInvited, { name: inv.inviterName || t.someone, target: inviteTarget(inv, t) }),
        // Accepting happens in the invitations menu; this just opens the app.
        target: { kind: 'path', path: '/' },
      };
    }
    case NotificationType.InvitationResponded: {
      const inv = n.payload;
      const template = inv.status === InvitationStatus.Accepted ? t.notifInviteAccepted : t.notifInviteDeclined;
      return {
        title: fill(template, { name: inv.inviteeName || t.someone, target: inviteTarget(inv, t) }),
        target: { kind: 'path', path: invitationPath(inv) },
      };
    }
    case NotificationType.TaskDueSoon:
    case NotificationType.TaskOverdue: {
      const due = n.payload;
      return {
        title: due.taskTitle,
        body:
          n.type === NotificationType.TaskDueSoon
            ? t.notifDueSoon
            : fill(t.notifOverdue, { date: dateLabel(due.dueDate, locale) }),
        target: { kind: 'task', taskId: due.taskId, projectId: due.projectId },
      };
    }
  }
}
