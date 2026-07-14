import { THEME_COLOR_OPTIONS } from '../constants';
import { ThemeColorId, ThemeMode } from '../types';

export function applyTheme(mode: ThemeMode, colorId: ThemeColorId): void {
  const color = THEME_COLOR_OPTIONS.find((c) => c.id === colorId);
  if (!color) return;

  const root = document.documentElement;
  const isLight = mode === 'light';

  root.setAttribute('data-mode', mode);
  root.setAttribute('data-color', colorId);

  root.style.setProperty('--accent-color', color.accent);
  root.style.setProperty('--bg-sidebar', isLight ? color.sidebarLight : color.sidebarDark);
  root.style.setProperty('--bg-main', isLight ? '#ffffff' : '#2b2c2f');
  root.style.setProperty('--bg-topbar', isLight ? '#ffffff' : '#2b2c2f');
  root.style.setProperty('--bg-hover', isLight ? '#f0f1f3' : '#333537');
  root.style.setProperty('--text-primary', isLight ? '#292d34' : '#f6f6f6');
  root.style.setProperty('--text-secondary', isLight ? '#7c828d' : '#87909e');
  root.style.setProperty('--border-color', isLight ? '#e8eaed' : '#383a3f');
  root.style.setProperty('--accent-muted', `color-mix(in srgb, ${color.accent} 10%, transparent)`);
  root.style.setProperty('--accent-muted-strong', `color-mix(in srgb, ${color.accent} 16%, transparent)`);
  root.style.setProperty('--accent-border', `color-mix(in srgb, ${color.accent} 20%, transparent)`);
}
