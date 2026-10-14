import { THEME_COLOR_OPTIONS } from '@task/core/features/theme/constants';
import { ThemeColorId, ThemeMode } from '@task/core/features/theme/types';

export interface ThemePalette {
  accent: string;
  bgSidebar: string;
  bgMain: string;
  bgTopbar: string;
  bgHover: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accentMuted: string;
  accentMutedStrong: string;
  accentBorder: string;
}

/**
 * The resolved colours for a theme, with no DOM involved.
 *
 * applyTheme() writes these onto :root as custom properties for the app's own
 * stylesheet, but the description editor renders in a separate document
 * (see RichTextEditor) that inherits nothing, so it needs the values themselves.
 * Both read them from here so the two cannot drift.
 */
export function resolveThemePalette(mode: ThemeMode, colorId: ThemeColorId): ThemePalette | null {
  const color = THEME_COLOR_OPTIONS.find((c) => c.id === colorId);
  if (!color) return null;

  const isLight = mode === 'light';
  return {
    accent: color.accent,
    bgSidebar: isLight ? color.sidebarLight : color.sidebarDark,
    bgMain: isLight ? '#ffffff' : '#2b2c2f',
    bgTopbar: isLight ? '#ffffff' : '#2b2c2f',
    bgHover: isLight ? '#f0f1f3' : '#333537',
    // Secondary text is kept at roughly 7:1 against the page in both modes,
    // so labels, dates and captions stay easy to read.
    textPrimary: isLight ? '#1f2329' : '#f6f6f6',
    textSecondary: isLight ? '#4f5762' : '#b0b8c3',
    border: isLight ? '#e8eaed' : '#383a3f',
    accentMuted: `color-mix(in srgb, ${color.accent} 10%, transparent)`,
    accentMutedStrong: `color-mix(in srgb, ${color.accent} 16%, transparent)`,
    accentBorder: `color-mix(in srgb, ${color.accent} 20%, transparent)`,
  };
}

export function applyTheme(mode: ThemeMode, colorId: ThemeColorId): void {
  const p = resolveThemePalette(mode, colorId);
  if (!p) return;

  const root = document.documentElement;

  root.setAttribute('data-mode', mode);
  root.setAttribute('data-color', colorId);

  root.style.setProperty('--accent-color', p.accent);
  root.style.setProperty('--bg-sidebar', p.bgSidebar);
  root.style.setProperty('--bg-main', p.bgMain);
  root.style.setProperty('--bg-topbar', p.bgTopbar);
  root.style.setProperty('--bg-hover', p.bgHover);
  root.style.setProperty('--text-primary', p.textPrimary);
  root.style.setProperty('--text-secondary', p.textSecondary);
  root.style.setProperty('--border-color', p.border);
  root.style.setProperty('--accent-muted', p.accentMuted);
  root.style.setProperty('--accent-muted-strong', p.accentMutedStrong);
  root.style.setProperty('--accent-border', p.accentBorder);
}
