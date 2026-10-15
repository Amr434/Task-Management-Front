import { THEME_COLOR_OPTIONS } from '@task/core/features/theme/constants';
import { ThemeColorId, ThemeMode } from '@task/core/features/theme/types';

export interface ThemePalette {
  accent: string;
  // Accent for text, icons and indicator lines: the accent itself unless it
  // would vanish against the page (e.g. Black in dark mode).
  accentText: string;
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
// WCAG relative luminance of a #rrggbb colour.
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function resolveThemePalette(mode: ThemeMode, colorId: ThemeColorId): ThemePalette | null {
  const color = THEME_COLOR_OPTIONS.find((c) => c.id === colorId);
  if (!color) return null;

  const isLight = mode === 'light';
  const bgMain = isLight ? '#ffffff' : '#2b2c2f';
  const textPrimary = isLight ? '#1f2329' : '#f6f6f6';
  return {
    accent: color.accent,
    accentText: contrast(color.accent, bgMain) < 2 ? textPrimary : color.accent,
    bgSidebar: isLight ? color.sidebarLight : color.sidebarDark,
    bgMain,
    bgTopbar: isLight ? '#ffffff' : '#2b2c2f',
    bgHover: isLight ? '#f0f1f3' : '#333537',
    // Secondary text is kept at roughly 7:1 against the page in both modes,
    // so labels, dates and captions stay easy to read.
    textPrimary,
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
  root.style.setProperty('--accent-text', p.accentText);
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
