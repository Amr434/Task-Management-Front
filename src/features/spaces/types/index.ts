export interface Space {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  members?: { id: number; name: string; initials: string }[];
}
