import type { CommentItem } from '../comments/types';
import type { Invitation } from '../invitations/types';
import type { TaskChange } from '../tasks/types';

// Mirrors backend Task_Management.Domain.Enums.NotificationType.
export enum NotificationType {
  TaskChanged = 0,
  CommentAdded = 1,
  Mentioned = 2,
  InvitationReceived = 3,
  InvitationResponded = 4,
  TaskDueSoon = 5,
  TaskOverdue = 6,
}

// Payload of the "due tomorrow" / "overdue" reminders (backend TaskDueDto).
export interface TaskDue {
  taskId: number;
  taskTitle: string;
  projectId: number;
  dueDate: string; // yyyy-MM-dd
}

// One entry in the notification list (backend NotificationDto). The payload
// is the same object the live pop-up carries.
export type NotificationItem = {
  id: number;
  createdAtUtc: string;
  isRead: boolean;
} & (
  | { type: NotificationType.TaskChanged; payload: TaskChange }
  | { type: NotificationType.CommentAdded | NotificationType.Mentioned; payload: CommentItem }
  | { type: NotificationType.InvitationReceived | NotificationType.InvitationResponded; payload: Invitation }
  | { type: NotificationType.TaskDueSoon | NotificationType.TaskOverdue; payload: TaskDue }
);

export enum EmailDeliveryMode {
  Instant = 0,
  DailyDigest = 1,
  Off = 2,
}

export enum SummaryFrequency {
  Off = 0,
  Daily = 1,
  Weekly = 2,
}

// The current user's email settings (backend NotificationSettingsDto).
export interface NotificationSettings {
  emailMode: EmailDeliveryMode;
  emailSummary: SummaryFrequency;
  emailAssignments: boolean;
  emailTaskUpdates: boolean;
  emailComments: boolean;
  emailMentions: boolean;
  emailInvitations: boolean;
  emailDueReminders: boolean;
}
