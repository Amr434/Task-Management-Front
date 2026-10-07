export enum InvitationTargetType {
  Space = 0,
  Project = 1
}

export enum InvitationStatus {
  Pending = 0,
  Accepted = 1,
  Declined = 2
}

export interface Invitation {
  id: number;
  targetType: InvitationTargetType;
  spaceId?: number | null;
  projectId?: number | null;
  targetName: string;
  inviterId: number;
  inviterName?: string;
  inviteeId: number;
  // Set on "accepted / declined" notifications sent to the inviter.
  inviteeName?: string | null;
  status: InvitationStatus;
  createdAtUtc: string;
}

export interface CreateInvitationDto {
  targetType: InvitationTargetType;
  targetId: number;
  inviteeUserId: number;
}
