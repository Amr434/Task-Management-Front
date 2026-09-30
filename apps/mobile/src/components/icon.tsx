import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';

/**
 * One icon vocabulary for the whole app, so a screen never reaches for a raw
 * glyph name. Ionicons is font-based (no native module), which keeps it usable
 * in Expo Go without a rebuild.
 */
const NAMES = {
  home: 'home-outline',
  homeActive: 'home',
  tasks: 'checkmark-circle-outline',
  tasksActive: 'checkmark-circle',
  profile: 'person-circle-outline',
  profileActive: 'person-circle',
  add: 'add',
  search: 'search',
  close: 'close',
  chevronRight: 'chevron-forward',
  chevronDown: 'chevron-down',
  chevronUp: 'chevron-up',
  caretRight: 'caret-forward',
  caretDown: 'caret-down',
  list: 'list-outline',
  folder: 'folder-outline',
  grid: 'grid-outline',
  clock: 'time-outline',
  inbox: 'file-tray-outline',
  flag: 'flag-outline',
  calendar: 'calendar-outline',
  today: 'today-outline',
  tomorrow: 'sunny-outline',
  thisWeek: 'calendar-number-outline',
  nextWeek: 'calendar-clear-outline',
  tag: 'pricetag-outline',
  subtask: 'git-branch-outline',
  person: 'person-outline',
  people: 'people-outline',
  trash: 'trash-outline',
  check: 'checkmark',
  statusOpen: 'ellipse-outline',
  statusProgress: 'radio-button-on',
  statusDone: 'checkmark-circle',
  logout: 'log-out-outline',
  settings: 'settings-outline',
} as const;

export type IconName = keyof typeof NAMES;

export function Icon({
  name,
  size = 22,
  color,
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
}) {
  return <Ionicons name={NAMES[name]} size={size} color={color as string} />;
}
