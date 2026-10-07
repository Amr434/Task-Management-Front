import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { canManageUsers } from '@task/core/features/auth/types';
import { useInvitationStore } from '@task/core/features/invitations/store/useInvitationStore';
import { createSpace, getSpaces } from '@task/core/features/spaces/api';
import type { Space } from '@task/core/features/spaces/types';
import { createProject, getProjectsBySpace } from '@task/core/features/projects/api';
import type { Project } from '@task/core/features/projects/types';
import { InvitationTargetType } from '@task/core/features/invitations/types';
import { useNotificationStore } from '@task/core/store/useNotificationStore';
import { useNotificationCenterStore } from '@task/core/features/notifications/store';
import { badgeLabel, refreshUnreadReplies } from '@task/core/features/comments/unread';
import { en } from '@task/core/i18n/dictionaries/en';

import { Avatar, Chip, ErrorState, Field, Loading, PrimaryButton, SectionHeader, Sheet, Tile, glyphFor } from '@/components/ui';
import { TaskSearchResults } from '@/components/task-search-results';
import { Icon, type IconName } from '@/components/icon';
import { InviteSheet, type InviteTarget } from '@/components/invite-sheet';
import { useTheme } from '@/theme';

const SPACE_COLORS = ['#7b68ee', '#2684ff', '#00c875', '#ffb800', '#e2445c', '#00b4d8', '#ff7b72', '#12a594'];

/** Shown in the header until the user picks a specific space. */
const WORKSPACE = { name: 'CiSS Egypt' };

// Opens the My Tasks tab on a given filter. `at` changes on every press so the
// screen applies the filter again even if it was already asked for.
const openMyTasks = (filter: 'open' | 'today') =>
  router.push({ pathname: '/my-tasks', params: { filter, at: String(Date.now()) } });

export default function HomeScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const params = useLocalSearchParams<{ new?: string }>();
  // Unread replies: the red badge on the Replies card (updates live).
  const unreadReplies = useNotificationStore((st) => st.unreadReplies);
  // Pending space/list invitations: the badge on the bell.
  const pendingInvitations = useInvitationStore((st) => st.pendingInvitations.length);
  const unreadNotifications = useNotificationCenterStore((st) => st.unreadCount);

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // null means "the whole workspace": the header shows CiSS Egypt and the tree
  // lists every space. Picking one narrows both.
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const [spacesOpen, setSpacesOpen] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [projects, setProjects] = useState<Record<number, Project[]>>({});
  const [loadingSpace, setLoadingSpace] = useState<number | null>(null);
  const [inviteTarget, setInviteTarget] = useState<InviteTarget | null>(null);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(SPACE_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // The space a new list is being added to; non-null keeps the sheet open.
  const [listSpace, setListSpace] = useState<Space | null>(null);
  const [listName, setListName] = useState('');
  const [listBusy, setListBusy] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSpaces(await getSpaces());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load spaces');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
      refreshUnreadReplies();
    }, [load])
  );

  // The floating + in the tab bar stamps a fresh value on ?new to ask for the
  // create sheet; the timestamp makes repeat taps register.
  useEffect(() => {
    if (params.new) setCreating(true);
  }, [params.new]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setProjects({});
    load().finally(() => setRefreshing(false));
  }, [load]);

  // Lists load the first time a space is opened, then stay cached.
  const loadProjects = useCallback(async (spaceId: number) => {
    setLoadingSpace(spaceId);
    try {
      const list = await getProjectsBySpace(spaceId);
      setProjects((prev) => ({ ...prev, [spaceId]: list }));
    } catch {
      setProjects((prev) => ({ ...prev, [spaceId]: [] }));
    } finally {
      setLoadingSpace(null);
    }
  }, []);

  const toggleSpace = (space: Space) => {
    const isOpen = expanded[space.id];
    setExpanded((prev) => ({ ...prev, [space.id]: !isOpen }));
    if (!isOpen && !projects[space.id]) void loadProjects(space.id);
  };

  const selectSpace = (space: Space | null) => {
    setSwitcherOpen(false);
    setSelectedSpaceId(space?.id ?? null);
    if (space) {
      setExpanded((prev) => ({ ...prev, [space.id]: true }));
      if (!projects[space.id]) void loadProjects(space.id);
    }
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setFormError(null);
    setBusy(true);
    try {
      const created = await createSpace({ name: trimmed, description: description.trim() || undefined, color });
      setSpaces((prev) => [...prev, created]);
      setCreating(false);
      setName('');
      setDescription('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the space');
    } finally {
      setBusy(false);
    }
  };

  const submitList = async () => {
    const trimmed = listName.trim();
    if (!trimmed || !listSpace) return;
    setListError(null);
    setListBusy(true);
    try {
      const created = await createProject({ name: trimmed, spaceId: listSpace.id });
      setProjects((prev) => ({ ...prev, [listSpace.id]: [...(prev[listSpace.id] ?? []), created] }));
      setListSpace(null);
      setListName('');
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not create the list');
    } finally {
      setListBusy(false);
    }
  };

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId) ?? null;

  const visible = (selectedSpace ? [selectedSpace] : spaces).filter((s) => {
    const q = query.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q);
  });


  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={onRefresh} />;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bgMain }}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setSwitcherOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Switch space"
          style={({ pressed }) => [styles.workspaceBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          {selectedSpace ? (
            <Tile
              text={glyphFor(selectedSpace.name, selectedSpace.icon)}
              color={selectedSpace.color || theme.accent}
              size={32}
            />
          ) : (
            // The whole workspace: the company logo.
            <Image
              source={require('../../../../assets/images/ciss-logo.png')}
              style={styles.logo}
              accessibilityLabel="CISS"
            />
          )}
          <Text style={[styles.workspace, { color: theme.textPrimary }]} numberOfLines={1}>
            {selectedSpace ? selectedSpace.name : WORKSPACE.name}
          </Text>
          <Icon name="chevronDown" size={17} color={theme.textSecondary} />
        </Pressable>
        {/* Space and list invitations, like the invitations button on the web. */}
        <Pressable
          onPress={() => router.push('/invitations')}
          hitSlop={8}
          accessibilityLabel={pendingInvitations > 0 ? `Invitations, ${pendingInvitations} pending` : 'Invitations'}
          style={({ pressed }) => [styles.bell, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Icon name="personAdd" size={23} color={theme.textSecondary} />
          {pendingInvitations > 0 ? (
            <View style={[styles.bellBadge, { backgroundColor: theme.danger, borderColor: theme.bgMain }]}>
              <Text style={styles.badgeText}>{pendingInvitations > 9 ? '9+' : pendingInvitations}</Text>
            </View>
          ) : null}
        </Pressable>
        {/* The notification list, like the bell at the top of the web app. */}
        <Pressable
          onPress={() => router.push('/notifications')}
          hitSlop={8}
          accessibilityLabel={
            unreadNotifications > 0 ? `${en.notifications}, ${unreadNotifications} unread` : en.notifications
          }
          style={({ pressed }) => [styles.bell, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Icon name="bell" size={24} color={theme.textSecondary} />
          {unreadNotifications > 0 ? (
            <View style={[styles.bellBadge, { backgroundColor: theme.danger, borderColor: theme.bgMain }]}>
              <Text style={styles.badgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable onPress={() => router.push('/profile')} accessibilityLabel="Profile">
          <Avatar
            firstName={user?.firstName}
            lastName={user?.lastName}
            avatarUrl={user?.avatarUrl}
            color={theme.accent}
            size={32}
          />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: theme.bgCanvas }]}>
          <Icon name="search" size={18} color={theme.textFaint} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search spaces and tasks"
            placeholderTextColor={theme.textFaint}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >
        <TaskSearchResults query={query} />

        {/* Equal cards that always fit the screen width (no sideways scrolling). */}
        <View style={styles.cards}>
          <QuickCard
            icon="replies"
            title="Replies"
            caption="comments"
            badge={unreadReplies}
            onPress={() => router.push('/replies')}
          />
          <QuickCard icon="tasks" title="Assigned" caption="to me" onPress={() => openMyTasks('open')} />
          <QuickCard icon="clock" title="Today" caption="& overdue" onPress={() => openMyTasks('today')} />
          {/* Admins and the Super Admin only, as on the web. */}
          {canManageUsers(user?.role) ? (
            <QuickCard icon="people" title="Users" caption="manage" onPress={() => router.push('/users')} />
          ) : null}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <SectionHeader
          title="Spaces"
          count={visible.length}
          expanded={spacesOpen}
          onToggle={() => setSpacesOpen((v) => !v)}
          onAdd={() => setCreating(true)}
        />

        {spacesOpen
          ? visible.map((space) => {
              const open = !!expanded[space.id];
              const lists = projects[space.id] ?? [];
              return (
                <View key={space.id}>
                  <Pressable
                    onPress={() => toggleSpace(space)}
                    onLongPress={() =>
                      router.push({ pathname: '/space/[id]', params: { id: String(space.id), name: space.name } })
                    }
                    style={({ pressed }) => [
                      styles.treeRow,
                      { backgroundColor: pressed ? theme.bgHover : 'transparent' },
                    ]}
                  >
                    <View style={styles.caret}>
                      <Icon name={open ? 'caretDown' : 'caretRight'} size={13} color={theme.textFaint} />
                    </View>
                    <Tile text={glyphFor(space.name, space.icon)} color={space.color || theme.accent} size={28} />
                    <Text style={[styles.treeLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                      {space.name}
                    </Text>
                    {loadingSpace === space.id ? <ActivityIndicator size="small" color={theme.textFaint} /> : null}
                    <Pressable
                      onPress={() =>
                        setInviteTarget({ type: InvitationTargetType.Space, id: space.id, name: space.name })
                      }
                      hitSlop={10}
                      accessibilityLabel={`Share ${space.name}`}
                      style={styles.shareBtn}
                    >
                      <Icon name="people" size={19} color={theme.textSecondary} />
                    </Pressable>
                  </Pressable>

                  {open
                    ? lists.map((project) => (
                          <Pressable
                            key={project.id}
                            onPress={() =>
                              router.push({
                                pathname: '/project/[id]',
                                params: { id: String(project.id), name: project.name },
                              })
                            }
                            style={({ pressed }) => [
                              styles.treeChild,
                              { backgroundColor: pressed ? theme.bgHover : 'transparent', borderLeftColor: theme.border },
                            ]}
                          >
                            <Icon name="list" size={16} color={theme.textFaint} />
                            <Text style={[styles.treeChildLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                              {project.name}
                            </Text>
                            <Pressable
                              onPress={() =>
                                setInviteTarget({
                                  type: InvitationTargetType.Project,
                                  id: project.id,
                                  name: project.name,
                                })
                              }
                              hitSlop={10}
                              accessibilityLabel={`Share ${project.name}`}
                              style={styles.shareBtn}
                            >
                              <Icon name="people" size={17} color={theme.textFaint} />
                            </Pressable>
                          </Pressable>
                        ))
                    : null}

                  {/* Creating a list happens right in the tree, so an empty
                      space shows the action instead of a dead-end message. */}
                  {open && loadingSpace !== space.id ? (
                    <Pressable
                      onPress={() => setListSpace(space)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add list to ${space.name}`}
                      style={({ pressed }) => [
                        styles.treeChild,
                        { backgroundColor: pressed ? theme.bgHover : 'transparent', borderLeftColor: theme.border },
                      ]}
                    >
                      <Icon name="add" size={16} color={theme.accent} />
                      <Text style={[styles.treeChildLabel, { color: theme.accent }]}>Add List</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })
          : null}

        {spacesOpen && visible.length === 0 ? (
          <Text style={[styles.treeEmpty, { color: theme.textFaint }]}>
            {query ? 'No spaces match your search.' : 'No spaces yet — tap + to create one.'}
          </Text>
        ) : null}
      </ScrollView>

      <InviteSheet visible={!!inviteTarget} target={inviteTarget} onClose={() => setInviteTarget(null)} />

      <Sheet visible={switcherOpen} title="Spaces" onClose={() => setSwitcherOpen(false)}>
        <Pressable
          onPress={() => selectSpace(null)}
          style={({ pressed }) => [
            styles.switchRow,
            { borderBottomColor: theme.border, backgroundColor: pressed ? theme.bgHover : 'transparent' },
          ]}
        >
          <Image
            source={require('../../../../assets/images/ciss-logo.png')}
            style={{ width: 34, height: 34 }}
            accessibilityLabel="CISS"
          />
          <View style={styles.switchText}>
            <Text
              style={[styles.switchName, { color: selectedSpaceId === null ? theme.accent : theme.textPrimary }]}
              numberOfLines={1}
            >
              {WORKSPACE.name}
            </Text>
            <Text style={[styles.switchSub, { color: theme.textSecondary }]}>All spaces · {spaces.length}</Text>
          </View>
          {selectedSpaceId === null ? <Icon name="check" size={19} color={theme.accent} /> : null}
        </Pressable>

        {spaces.map((space) => {
          const active = selectedSpaceId === space.id;
          return (
            <Pressable
              key={space.id}
              onPress={() => selectSpace(space)}
              style={({ pressed }) => [
                styles.switchRow,
                { borderBottomColor: theme.border, backgroundColor: pressed ? theme.bgHover : 'transparent' },
              ]}
            >
              <Tile text={glyphFor(space.name, space.icon)} color={space.color || theme.accent} size={34} />
              <View style={styles.switchText}>
                <Text
                  style={[styles.switchName, { color: active ? theme.accent : theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {space.name}
                </Text>
                <Text style={[styles.switchSub, { color: theme.textSecondary }]} numberOfLines={1}>
                  {projects[space.id]?.length ? `${projects[space.id].length} lists` : space.description || 'Space'}
                </Text>
              </View>
              {active ? <Icon name="check" size={19} color={theme.accent} /> : null}
            </Pressable>
          );
        })}

        <View style={{ marginTop: 18 }}>
          <PrimaryButton
            label="Create Space"
            onPress={() => {
              setSwitcherOpen(false);
              setCreating(true);
            }}
          />
        </View>
      </Sheet>

      <Sheet
        visible={!!listSpace}
        title={listSpace ? `New list in ${listSpace.name}` : 'Create List'}
        onClose={() => setListSpace(null)}
      >
        <Field label="List name" value={listName} onChangeText={setListName} placeholder="Website redesign" autoFocus />
        {listError ? <Chip text={listError} color={theme.danger} /> : null}
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="Create List" onPress={submitList} disabled={!listName.trim()} busy={listBusy} />
        </View>
      </Sheet>

      <Sheet visible={creating} title="Create Space" onClose={() => setCreating(false)}>
        <Field label="Name" value={name} onChangeText={setName} placeholder="Marketing" autoFocus />
        <Field
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="What is this space for?"
          multiline
        />
        <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>Colour</Text>
        <View style={styles.swatches}>
          {SPACE_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              accessibilityLabel={`Colour ${c}`}
              style={[styles.swatch, { backgroundColor: c, borderColor: color === c ? theme.textPrimary : 'transparent' }]}
            />
          ))}
        </View>
        {formError ? <Chip text={formError} color={theme.danger} /> : null}
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="Create Space" onPress={submit} disabled={!name.trim()} busy={busy} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function QuickCard({
  icon,
  title,
  caption,
  badge = 0,
  onPress,
}: {
  icon: IconName;
  title: string;
  caption: string;
  // Unread count shown as a red badge on the corner (hidden at 0).
  badge?: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={badge > 0 ? `${title}, ${en.unreadRepliesCount.replace('{count}', String(badge))}` : title}
      style={({ pressed }) => [styles.card, { backgroundColor: theme.bgCanvas, opacity: pressed ? 0.7 : 1 }]}
    >
      <Icon name={icon} size={20} color={theme.textSecondary} />
      {badge > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.danger, borderColor: theme.bgMain }]}>
          <Text style={styles.badgeText}>{badgeLabel(badge)}</Text>
        </View>
      ) : null}
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
        {title}
      </Text>
      <Text style={[styles.cardCaption, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>
        {caption}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  workspaceBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  workspace: { flexShrink: 1, fontSize: 19, fontWeight: '700' },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 6 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 14, height: 44 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  body: { paddingHorizontal: 16, paddingBottom: 170 },
  cards: { flexDirection: 'row', gap: 8, paddingVertical: 12 },
  card: { flex: 1, minWidth: 0, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 8, gap: 4, alignItems: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '700' },
  cardCaption: { fontSize: 11 },
  logo: { width: 32, height: 32 },
  bell: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 4 },
  treeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderRadius: 8, paddingHorizontal: 4 },
  caret: { width: 14, alignItems: 'center' },
  treeLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  shareBtn: { padding: 4 },
  treeChild: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 18,
    marginLeft: 17,
    borderLeftWidth: 1,
  },
  treeChildLabel: { flex: 1, fontSize: 14 },
  treeEmpty: { fontSize: 13, paddingVertical: 10, paddingLeft: 40 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  switchText: { flex: 1, gap: 2 },
  switchName: { fontSize: 15, fontWeight: '700' },
  switchSub: { fontSize: 12 },
  pickerLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2 },
});
