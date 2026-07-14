export type ThemeMode = 'light' | 'dark';

export type ThemeColorId =
  | 'black'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'blue'
  | 'violet'
  | 'indigo'
  | 'teal'
  | 'bronze'
  | 'mint';

export interface ThemeColorOption {
  id: ThemeColorId;
  label: string;
  accent: string;
  sidebarLight: string;
  sidebarDark: string;
}

export interface ThemeState {
  mode: ThemeMode;
  color: ThemeColorId;
}

export interface UserThemePreferences {
  mode: ThemeMode;
  color: ThemeColorId;
}

export type ThemesByUser = Record<string, UserThemePreferences>;
