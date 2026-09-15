import { ThemeColorOption } from './types';

export const THEME_COLOR_OPTIONS: ThemeColorOption[] = [
  { id: 'black', label: 'Black', accent: '#292d34', sidebarLight: '#eef0f2', sidebarDark: '#1a1b1d' },
  { id: 'purple', label: 'Purple', accent: '#7b68ee', sidebarLight: '#f3f0ff', sidebarDark: '#272438' },
  { id: 'pink', label: 'Pink', accent: '#ff69b4', sidebarLight: '#fff0f8', sidebarDark: '#2e1f29' },
  { id: 'orange', label: 'Orange', accent: '#fdab3d', sidebarLight: '#fff8ef', sidebarDark: '#2e2619' },
  { id: 'blue', label: 'Blue', accent: '#2684ff', sidebarLight: '#eef5ff', sidebarDark: '#1a2333' },
  { id: 'violet', label: 'Violet', accent: '#784bd1', sidebarLight: '#f5f0ff', sidebarDark: '#271f3d' },
  { id: 'indigo', label: 'Indigo', accent: '#5b69ff', sidebarLight: '#f0f1ff', sidebarDark: '#1f2238' },
  { id: 'teal', label: 'Teal', accent: '#12a594', sidebarLight: '#ecfbf9', sidebarDark: '#1a2b29' },
  { id: 'bronze', label: 'Bronze', accent: '#aa8d80', sidebarLight: '#f8f4f2', sidebarDark: '#2a2523' },
  { id: 'mint', label: 'Mint', accent: '#0f9d8a', sidebarLight: '#ecfbf8', sidebarDark: '#1a2d2a' },
];

export const DEFAULT_THEME_MODE = 'light' as const;
export const DEFAULT_THEME_COLOR = 'black' as const;
