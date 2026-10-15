export interface Project {
  id: number;
  name: string;
  description?: string;
  // Backend ProjectDto exposes spaceId (a project belongs to a space, not a workspace).
  spaceId: number;
  // Not returned by the API today; kept optional for UI theming with a fallback.
  color?: string;
  icon?: string;
  members?: { id: number; name: string; initials: string; avatarUrl?: string | null }[];
  // Custom board statuses; the built-in To Do / In Progress / Complete (0-2) are implicit.
  statuses?: ProjectStatus[];
}

// A custom status column. Tasks in it carry status === id (always >= 3).
export interface ProjectStatus {
  id: number;
  name: string;
  color: string;
}
