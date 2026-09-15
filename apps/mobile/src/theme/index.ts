import { useColorScheme } from 'react-native';
import { THEME_COLOR_OPTIONS, DEFAULT_THEME_COLOR } from '@task/core/features/theme/constants';
import type { ThemeColorId, ThemeMode } from '@task/core/features/theme/types';

// The web app paints itself with CSS custom properties (see applyTheme.ts).
// React Native has no CSS, so the same colour roles become a plain object.
// Keep the two in sync: the roles here mirror the --var names one for one.

// color-mix() has no React Native equivalent, so the muted accents are
// pre-mixed against the surface as rgba instead.
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface Theme {
  mode: ThemeMode;
  accent: string;
  accentMuted: string;
  accentMutedStrong: string;
  accentBorder: string;
  bgSidebar: string;
  bgMain: string;
  bgHover: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  danger: string;
}

export function buildTheme(mode: ThemeMode, colorId: ThemeColorId): Theme {
  const color =
    THEME_COLOR_OPTIONS.find((c) => c.id === colorId) ??
    THEME_COLOR_OPTIONS.find((c) => c.id === DEFAULT_THEME_COLOR)!;
  const isLight = mode === 'light';

  return {
    mode,
    accent: color.accent,
    accentMuted: withAlpha(color.accent, 0.1),
    accentMutedStrong: withAlpha(color.accent, 0.16),
    accentBorder: withAlpha(color.accent, 0.2),
    bgSidebar: isLight ? color.sidebarLight : color.sidebarDark,
    bgMain: isLight ? '#ffffff' : '#2b2c2f',
    bgHover: isLight ? '#f0f1f3' : '#333537',
    textPrimary: isLight ? '#292d34' : '#f6f6f6',
    textSecondary: isLight ? '#7c828d' : '#87909e',
    border: isLight ? '#e8eaed' : '#383a3f',
    danger: '#e2445c',
  };
}

// Follows the device setting for now. Once the mobile app reads the user's
// saved preference from GET /users/me/theme, swap the source here.
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return buildTheme(scheme === 'dark' ? 'dark' : 'light', DEFAULT_THEME_COLOR);
}
