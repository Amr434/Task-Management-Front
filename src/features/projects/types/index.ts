export interface Project {
  id: number;
  name: string;
  description?: string;
  // Backend ProjectDto exposes spaceId (a project belongs to a space, not a workspace).
  spaceId: number;
  // Not returned by the API today; kept optional for UI theming with a fallback.
  color?: string;
  icon?: string;
  members?: { id: number; name: string; initials: string }[];
}
