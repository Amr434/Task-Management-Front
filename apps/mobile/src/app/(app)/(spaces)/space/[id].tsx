import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { createProject, getProjectsBySpace } from '@task/core/features/projects/api';
import type { Project } from '@task/core/features/projects/types';

import { InvitationTargetType } from '@task/core/features/invitations/types';

import { InviteSheet, type InviteTarget } from '@/components/invite-sheet';
import { AddRow, Chip, ErrorState, Field, Loading, PrimaryButton, Sheet, Tile } from '@/components/ui';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme';

export default function SpaceScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const spaceId = Number(id);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [inviteTarget, setInviteTarget] = useState<InviteTarget | null>(null);

  // The tree passes the name through so the header is right immediately,
  // without a second request just to title the screen.
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        title: name ?? 'Space',
        // Sharing the whole space lives in the header; sharing a single list
        // sits on that list's row below.
        headerRight: () => (
          <Pressable
            onPress={() =>
              setInviteTarget({ type: InvitationTargetType.Space, id: spaceId, name: name ?? 'this space' })
            }
            hitSlop={10}
            accessibilityLabel="Share space"
          >
            <Icon name="people" size={22} color={theme.accent} />
          </Pressable>
        ),
      });
    }, [name, navigation, spaceId, theme.accent])
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      setProjects(await getProjectsBySpace(spaceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load lists');
    }
  }, [spaceId]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  const submit = async () => {
    const trimmed = projectName.trim();
    if (!trimmed) return;
    setFormError(null);
    setBusy(true);
    try {
      const created = await createProject({ name: trimmed, spaceId });
      setProjects((prev) => [...prev, created]);
      setCreating(false);
      setProjectName('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the list');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={onRefresh} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgMain }}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >
        <Text style={[styles.sectionLabel, { color: theme.textFaint }]}>LISTS</Text>

        {projects.map((project) => (
          <Pressable
            key={project.id}
            onPress={() =>
              router.push({ pathname: '/project/[id]', params: { id: String(project.id), name: project.name } })
            }
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: theme.border, backgroundColor: pressed ? theme.bgHover : 'transparent' },
            ]}
          >
            <Tile text={project.name.charAt(0).toUpperCase()} color={project.color || theme.accent} size={28} />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {project.name}
              </Text>
              {project.description ? (
                <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                  {project.description}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() =>
                setInviteTarget({ type: InvitationTargetType.Project, id: project.id, name: project.name })
              }
              hitSlop={10}
              accessibilityLabel={`Share ${project.name}`}
              style={styles.shareBtn}
            >
              <Icon name="people" size={19} color={theme.textFaint} />
            </Pressable>
            <Icon name="chevronRight" size={18} color={theme.textFaint} />
          </Pressable>
        ))}

        <AddRow label="Add List" onPress={() => setCreating(true)} />
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add list"
        onPress={() => setCreating(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.accent, shadowColor: theme.shadow, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Icon name="add" size={30} color="#ffffff" />
      </Pressable>

      <InviteSheet visible={!!inviteTarget} target={inviteTarget} onClose={() => setInviteTarget(null)} />

      <Sheet visible={creating} title="Create List" onClose={() => setCreating(false)}>
        <Field label="List name" value={projectName} onChangeText={setProjectName} placeholder="Website redesign" autoFocus />
        {formError ? <Chip text={formError} color={theme.danger} /> : null}
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="Create List" onPress={submit} disabled={!projectName.trim()} busy={busy} />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 170 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 13 },
  shareBtn: { padding: 4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  },
});
