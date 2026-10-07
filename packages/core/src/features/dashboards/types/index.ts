export interface DashboardMember {
  id: number;
  name: string;
  initials: string;
}

export interface Dashboard {
  id: number;
  name: string;
  spaceId: number;
  spaceName: string;
  ownerId: number;
  ownerName: string;
  ownerInitials: string;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string;
  isSpaceShared: boolean;
  sharingMembers: DashboardMember[];
}

export interface AssigneeCount {
  label: string;
  count: number;
  userId?: number;
}

export interface WorkloadByStatus {
  unassigned: number;
  assigned: number;
  inProgress: number;
  completed: number;
}

export interface DashboardSummary {
  dashboard: Dashboard;
  spaceName: string;
  spaceDescription?: string;
  spaceColor?: string;
  spaceIcon?: string;
  isSpaceShared: boolean;
  workloadByStatus?: WorkloadByStatus;
  tasksByAssignee: AssigneeCount[];
  openTasksByAssignee: AssigneeCount[];
  completedThisWeekByAssignee: AssigneeCount[];
}

export interface CreateDashboardPayload {
  spaceId: number;
}
