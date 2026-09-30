import { useColorScheme } from 'react-native';
import { THEME_COLOR_OPTIONS } from '@task/core/features/theme/constants';
import type { ThemeColorId, ThemeMode } from '@task/core/features/theme/types';

// The web app paints itself with CSS custom properties (see applyTheme.ts).
// React Native has no CSS, so the same colour roles become a plain object.
// Keep the two in sync: the roles here mirror the --var names one for one.

// ClickUp's own accent. The web palette already carries it as 'purple', so both
// clients stay on one set of brand colours.
const DEFAULT_COLOR: ThemeColorId = 'purple';

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
  /** Page background. */
  bgMain: string;
  /** Grouped-content background behind cards, like ClickUp's grey canvas. */
  bgCanvas: string;
  /** Raised surfaces: cards, sheets, the floating tab bar. */
  bgSurface: string;
  bgHover: string;
  textPrimary: string;
  textSecondary: string;
  textFaint: string;
  border: string;
  danger: string;
  /** Shadow colour for floating elements. */
  shadow: string;
}

export function buildTheme(mode: ThemeMode, colorId: ThemeColorId): Theme {
  const color =
    THEME_COLOR_OPTIONS.find((c) => c.id === colorId) ??
    THEME_COLOR_OPTIONS.find((c) => c.id === DEFAULT_COLOR)!;
  const isLight = mode === 'light';

  return {
    mode,
    accent: color.accent,
    accentMuted: withAlpha(color.accent, 0.1),
    accentMutedStrong: withAlpha(color.accent, 0.16),
    accentBorder: withAlpha(color.accent, 0.24),
    bgMain: isLight ? '#ffffff' : '#1f2023',
    bgCanvas: isLight ? '#f7f8f9' : '#17181a',
    bgSurface: isLight ? '#ffffff' : '#2b2c2f',
    bgHover: isLight ? '#f0f1f3' : '#333537',
    textPrimary: isLight ? '#1d1f26' : '#f6f6f6',
    textSecondary: isLight ? '#6b7280' : '#a3abb6',
    textFaint: isLight ? '#9aa1ac' : '#7c828d',
    border: isLight ? '#e8eaed' : '#383a3f',
    danger: '#e2445c',
    shadow: isLight ? 'rgba(29, 31, 38, 0.16)' : 'rgba(0, 0, 0, 0.5)',
  };
}

// Follows the device setting for now. Once the mobile app reads the user's
// saved preference from GET /users/me/theme, swap the source here.
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return buildTheme(scheme === 'dark' ? 'dark' : 'light', DEFAULT_COLOR);
}
