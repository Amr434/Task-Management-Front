import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs, router } from 'expo-router';
import { useInvitationStore } from '@task/core/features/invitations/store/useInvitationStore';

import { Icon, type IconName } from '@/components/icon';
import { useTheme } from '@/theme';

// expo-router 57 ships its own fork of the bottom tabs, and the props type is
// not on the package root. Deriving it from the component keeps this on the
// public API instead of a build/ internal path.
type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Record<string, { on: IconName; off: IconName }> = {
  '(spaces)': { on: 'homeActive', off: 'home' },
  'my-tasks': { on: 'tasksActive', off: 'tasks' },
  inbox: { on: 'inbox', off: 'inbox' },
  profile: { on: 'profileActive', off: 'profile' },
};

/**
 * ClickUp floats its navigation as a rounded pill rather than a bar pinned to
 * the edge. The create button sits in the centre with the tabs split evenly on
 * either side, so it stays dead centre whatever the tab count.
 *
 * The + is a global create: it stamps ?new on the active tab, which that screen
 * reads to open its own create sheet.
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pendingCount = useInvitationStore((st) => st.pendingInvitations.length);

  const half = Math.ceil(state.routes.length / 2);
  const leftRoutes = state.routes.slice(0, half);
  const rightRoutes = state.routes.slice(half);

  const createOnActiveTab = () => {
    const active = state.routes[state.index];
    router.setParams({ new: String(Date.now()) });
    // setParams only affects the focused screen; from another tab, switch to
    // the spaces tab first so there is a create sheet to open.
    if (active.name !== '(spaces)') {
      navigation.navigate('(spaces)' as never);
      setTimeout(() => router.setParams({ new: String(Date.now()) }), 0);
    }
  };

  const renderTab = (route: (typeof state.routes)[number], index: number) => {
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const label = (options.title ?? route.name) as string;

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={label}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
        style={({ pressed }) => [
          styles.tab,
          focused ? { backgroundColor: theme.accentMuted } : null,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Icon
          name={focused ? (ICONS[route.name]?.on ?? 'grid') : (ICONS[route.name]?.off ?? 'grid')}
          size={26}
          color={focused ? theme.accent : theme.textSecondary}
        />
        {route.name === 'inbox' && pendingCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.danger, borderColor: theme.bgSurface }]}>
            <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
      <View
        style={[
          styles.pill,
          { backgroundColor: theme.bgSurface, shadowColor: theme.shadow, borderColor: theme.border },
        ]}
      >
        <View style={styles.side}>{leftRoutes.map((route, i) => renderTab(route, i))}</View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create"
          onPress={createOnActiveTab}
          style={({ pressed }) => [
            styles.plus,
            { backgroundColor: theme.accent, shadowColor: theme.shadow, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Icon name="add" size={32} color="#ffffff" />
        </Pressable>

        <View style={styles.side}>{rightRoutes.map((route, i) => renderTab(route, half + i))}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 40,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 10,
    elevation: 10,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  tab: { width: 62, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 8,
    right: 12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  plus: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    elevation: 8,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
});
