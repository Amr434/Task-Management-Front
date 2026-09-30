import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { getTasksByProject, patchTask } from '@task/core/features/tasks/api';
import { Priority, TaskStatus, priorityMeta, type TaskItem } from '@task/core/features/tasks/types';
import { InvitationTargetType } from '@task/core/features/invitations/types';

import { AddRow, Chip, ErrorState, Loading, Sheet, StatusGlyph, StatusPill } from '@/components/ui';
import { InviteSheet, type InviteTarget } from '@/components/invite-sheet';
import { STATUS_META, STATUS_ORDER, formatDueDate, nextStatus } from '@/features/tasks/display';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme';

type ViewMode = 'list' | 'board';

const VIEWS: { key: ViewMode; label: string; icon: 'list' | 'grid' }[] = [
  { key: 'list', label: 'List', icon: 'list' },
  { key: 'board', label: 'Board', icon: 'grid' },
];

export default function ProjectScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const projectId = Number(id);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const [view, setView] = useState<ViewMode>('list');
  const [viewsOpen, setViewsOpen] = useState(false);

  const [inviteTarget, setInviteTarget] = useState<InviteTarget | null>(null);

  const activeView = VIEWS.find((v) => v.key === view)!;

  // The header carries the list name with the current view under it, the way
  // ClickUp stacks them, so switching views never leaves the screen.
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerTitle: () => (
          <Pressable onPress={() => setViewsOpen(true)} style={styles.headerTitle} accessibilityLabel="Change view">
            <Text style={[styles.headerName, { color: theme.textPrimary }]} numberOfLines={1}>
              {name ?? 'List'}
            </Text>
            <View style={styles.headerView}>
              <Icon name={activeView.icon} size={13} color={theme.textSecondary} />
              <Text style={[styles.headerViewText, { color: theme.textSecondary }]}>{activeView.label}</Text>
              <Icon name="chevronDown" size={12} color={theme.textSecondary} />
            </View>
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={() =>
              setInviteTarget({ type: InvitationTargetType.Project, id: projectId, name: name ?? 'this list' })
            }
            hitSlop={10}
            accessibilityLabel="Share list"
          >
            <Icon name="people" size={22} color={theme.accent} />
          </Pressable>
        ),
      });
    }, [name, navigation, projectId, theme.accent, theme.textPrimary, theme.textSecondary, activeView])
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      setTasks(await getTasksByProject(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tasks');
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  const childrenOf = useMemo(() => {
    const map: Record<number, TaskItem[]> = {};
    for (const t of tasks) if (t.parentTaskId) (map[t.parentTaskId] ||= []).push(t);
    return map;
  }, [tasks]);

  // Both views group by status, keeping every status visible even when empty so
  // the shape of the work stays legible.
  const groups = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        status,
        meta: STATUS_META[status],
        items: tasks.filter((t) => !t.parentTaskId && t.status === status),
      })),
    [tasks]
  );

  // Optimistic: PUT /Tasks/{id} answers with empty tags/assignees, so the
  // response must never be spread into state — apply the patch, revert on error.
  const cycleStatus = async (task: TaskItem) => {
    const status = nextStatus(task.status);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await patchTask(task, { status });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  };

  // Creating opens the full-screen composer so a task can carry a long
  // description and attachments, rather than a one-line sheet.
  const openCreate = (status: TaskStatus) => {
    router.push({
      pathname: '/task/new',
      params: { projectId: String(projectId), status: String(status), listName: name ?? '' },
    });
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={onRefresh} />;

  const columnWidth = Math.min(300, width * 0.78);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgMain }}>
      {view === 'list' ? (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        >
          {groups.map((group) => {
            const isCollapsed = collapsed[group.status];
            return (
              <View key={group.status} style={styles.group}>
                <View style={[styles.rail, { backgroundColor: group.meta.color }]} />
                <View style={styles.groupBody}>
                  <Pressable
                    onPress={() => setCollapsed((p) => ({ ...p, [group.status]: !isCollapsed }))}
                    style={styles.groupHead}
                  >
                    <View style={styles.caret}>
                      <Icon name={isCollapsed ? 'caretRight' : 'caretDown'} size={14} color={theme.textSecondary} />
                    </View>
                    <StatusPill label={group.meta.label} count={group.items.length} color={group.meta.color} />
                  </Pressable>

                  {!isCollapsed ? (
                    <>
                      <View style={[styles.colHead, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.colHeadText, { color: theme.textFaint }]}>Name</Text>
                      </View>

                      {group.items.map((task) => (
                        <View key={task.id}>
                          <TaskRow task={task} onToggle={cycleStatus} />
                          {(childrenOf[task.id] ?? []).map((child) => (
                            <View key={child.id} style={styles.childWrap}>
                              <TaskRow task={child} onToggle={cycleStatus} nested />
                            </View>
                          ))}
                        </View>
                      ))}

                      <AddRow label="Add Task" onPress={() => openCreate(group.status)} />
                    </>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.boardBody}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        >
          {groups.map((group) => (
            <View key={group.status} style={[styles.column, { width: columnWidth, backgroundColor: theme.bgCanvas }]}>
              <View style={[styles.columnTop, { backgroundColor: group.meta.color }]} />
              <View style={styles.columnHead}>
                <StatusPill label={group.meta.label} count={group.items.length} color={group.meta.color} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.columnBody}>
                {group.items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subtasks={(childrenOf[task.id] ?? []).length}
                    onToggle={cycleStatus}
                  />
                ))}
                <AddRow label="Add Task" onPress={() => openCreate(group.status)} />
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add task"
        onPress={() => openCreate(TaskStatus.ToDo)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.accent, shadowColor: theme.shadow, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Icon name="add" size={30} color="#ffffff" />
      </Pressable>

      <InviteSheet visible={!!inviteTarget} target={inviteTarget} onClose={() => setInviteTarget(null)} />

      <Sheet visible={viewsOpen} title="Views" onClose={() => setViewsOpen(false)}>
        {VIEWS.map((v) => (
          <Pressable
            key={v.key}
            onPress={() => {
              setView(v.key);
              setViewsOpen(false);
            }}
            style={({ pressed }) => [
              styles.viewRow,
              { borderBottomColor: theme.border, backgroundColor: pressed ? theme.bgHover : 'transparent' },
            ]}
          >
            <View style={[styles.viewIcon, { backgroundColor: theme.accentMuted }]}>
              <Icon name={v.icon} size={18} color={theme.accent} />
            </View>
            <Text style={[styles.viewLabel, { color: view === v.key ? theme.accent : theme.textPrimary }]}>
              {v.label}
            </Text>
            {view === v.key ? <Icon name="check" size={19} color={theme.accent} /> : null}
          </Pressable>
        ))}
      </Sheet>

    </View>
  );
}

function TaskRow({
  task,
  onToggle,
  nested,
}: {
  task: TaskItem;
  onToggle: (t: TaskItem) => void;
  nested?: boolean;
}) {
  const theme = useTheme();
  const meta = STATUS_META[task.status] ?? STATUS_META[TaskStatus.ToDo];
  const prio = priorityMeta(task.priority);
  const done = task.status === TaskStatus.Complete;
  const due = formatDueDate(task.dueDate);

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/task/[id]', params: { id: String(task.id), projectId: String(task.projectId) } })
      }
      style={({ pressed }) => [
        styles.task,
        { borderBottomColor: theme.border, backgroundColor: pressed ? theme.bgHover : 'transparent' },
      ]}
    >
      <Pressable hitSlop={10} onPress={() => onToggle(task)} accessibilityLabel={`Mark as ${meta.label}`}>
        <StatusGlyph color={meta.color} done={done} inProgress={task.status === TaskStatus.InProgress} />
      </Pressable>

      <View style={styles.taskMain}>
        <Text
          style={[
            styles.taskTitle,
            { color: theme.textPrimary },
            nested ? { fontSize: 14 } : null,
            done ? { textDecorationLine: 'line-through', color: theme.textSecondary } : null,
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        {due || task.priority !== Priority.Low || task.assignees?.length ? (
          <View style={styles.meta}>
            {task.priority !== Priority.Low ? <Chip text={prio.label} color={prio.color} /> : null}
            {due ? <Chip text={due.label} color={due.overdue ? theme.danger : theme.textSecondary} /> : null}
            {task.assignees?.length ? <Chip text={`${task.assignees.length}`} color={theme.accent} /> : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Board cards carry the same data as a row, laid out to stack in a column. */
function TaskCard({
  task,
  subtasks,
  onToggle,
}: {
  task: TaskItem;
  subtasks: number;
  onToggle: (t: TaskItem) => void;
}) {
  const theme = useTheme();
  const meta = STATUS_META[task.status] ?? STATUS_META[TaskStatus.ToDo];
  const prio = priorityMeta(task.priority);
  const done = task.status === TaskStatus.Complete;
  const due = formatDueDate(task.dueDate);

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/task/[id]', params: { id: String(task.id), projectId: String(task.projectId) } })
      }
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.bgSurface, borderColor: theme.border, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={styles.cardHead}>
        <Pressable hitSlop={10} onPress={() => onToggle(task)} accessibilityLabel={`Mark as ${meta.label}`}>
          <StatusGlyph color={meta.color} done={done} inProgress={task.status === TaskStatus.InProgress} size={19} />
        </Pressable>
        <Text
          style={[
            styles.cardTitle,
            { color: theme.textPrimary },
            done ? { textDecorationLine: 'line-through', color: theme.textSecondary } : null,
          ]}
          numberOfLines={3}
        >
          {task.title}
        </Text>
      </View>

      <View style={styles.meta}>
        {task.priority !== Priority.Low ? <Chip text={prio.label} color={prio.color} /> : null}
        {due ? <Chip text={due.label} color={due.overdue ? theme.danger : theme.textSecondary} /> : null}
        {subtasks ? <Chip text={`${subtasks} subtasks`} color={theme.textSecondary} /> : null}
        {task.assignees?.length ? <Chip text={`${task.assignees.length} assigned`} color={theme.accent} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerTitle: { alignItems: 'center', gap: 1 },
  headerName: { fontSize: 16, fontWeight: '700', maxWidth: 200 },
  headerView: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerViewText: { fontSize: 12, fontWeight: '600' },

  body: { padding: 16, paddingBottom: 170, gap: 18 },
  group: { flexDirection: 'row', gap: 12 },
  rail: { width: 4, borderRadius: 2 },
  groupBody: { flex: 1 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  caret: { width: 16, alignItems: 'center' },
  colHead: { borderBottomWidth: 1, paddingVertical: 8, marginTop: 8 },
  colHeadText: { fontSize: 12, fontWeight: '600' },
  task: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  childWrap: { paddingLeft: 22 },
  taskMain: { flex: 1, gap: 6 },
  taskTitle: { fontSize: 15, fontWeight: '500' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  boardBody: { padding: 16, paddingBottom: 170, gap: 12 },
  column: { borderRadius: 14, overflow: 'hidden', maxHeight: '100%' },
  columnTop: { height: 4 },
  columnHead: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  columnBody: { padding: 12, gap: 10 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '600' },

  pickerLabel: { fontSize: 13, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  viewIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  viewLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
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
