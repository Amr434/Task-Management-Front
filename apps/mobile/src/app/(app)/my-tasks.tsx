import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { getAssignedTasks, patchTask } from '@task/core/features/tasks/api';
import { TaskStatus, priorityMeta, type TaskItem } from '@task/core/features/tasks/types';

import { Chip, Empty, ErrorState, Loading, StatusGlyph } from '@/components/ui';
import { STATUS_META, formatDueDate, nextStatus } from '@/features/tasks/display';
import { useTheme } from '@/theme';

type Filter = 'open' | 'today' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'today', label: 'Today & overdue' },
  { key: 'all', label: 'All' },
];

export default function MyTasksScreen() {
  const theme = useTheme();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('open');

  const load = useCallback(async () => {
    setError(null);
    try {
      setTasks(await getAssignedTasks());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your tasks');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  const visible = useMemo(() => {
    if (filter === 'all') return tasks;
    if (filter === 'open') return tasks.filter((t) => t.status !== TaskStatus.Complete);
    // Today & overdue: anything due up to the end of today and not finished.
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return tasks.filter(
      (t) => t.status !== TaskStatus.Complete && t.dueDate && new Date(t.dueDate) <= endOfToday
    );
  }, [tasks, filter]);

  const cycleStatus = async (task: TaskItem) => {
    const status = nextStatus(task.status);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await patchTask(task, { status });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={onRefresh} />;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.bgMain }]}>
      <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>My Tasks</Text>
      <View style={[styles.filters, { borderBottomColor: theme.border }]}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filter,
                {
                  backgroundColor: active ? theme.accentMuted : 'transparent',
                  borderColor: active ? theme.accentBorder : theme.border,
                },
              ]}
            >
              <Text style={{ color: active ? theme.accent : theme.textSecondary, fontSize: 13, fontWeight: '600' }}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        ListEmptyComponent={<Empty text="Nothing assigned to you here." />}
        renderItem={({ item }) => {
          const status = STATUS_META[item.status] ?? STATUS_META[TaskStatus.ToDo];
          const prio = priorityMeta(item.priority);
          const done = item.status === TaskStatus.Complete;
          const due = formatDueDate(item.dueDate);

          return (
            <View style={[styles.task, { borderColor: theme.border, backgroundColor: theme.bgHover }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Mark as ${status.label}`}
                hitSlop={10}
                onPress={() => cycleStatus(item)}
              >
                <StatusGlyph color={status.color} done={done} inProgress={item.status === TaskStatus.InProgress} />
              </Pressable>

              <Pressable
                style={styles.taskMain}
                onPress={() =>
                  router.push({
                    pathname: '/task/[id]',
                    params: { id: String(item.id), projectId: String(item.projectId) },
                  })
                }
              >
                <Text
                  style={[
                    styles.taskTitle,
                    { color: theme.textPrimary },
                    done ? { textDecorationLine: 'line-through', color: theme.textSecondary } : null,
                  ]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                {item.projectName || item.spaceName ? (
                  <Text style={[styles.breadcrumb, { color: theme.textSecondary }]} numberOfLines={1}>
                    {[item.spaceName, item.projectName].filter(Boolean).join(' / ')}
                  </Text>
                ) : null}
                <View style={styles.meta}>
                  <Chip text={status.label} color={status.color} />
                  <Chip text={prio.label} color={prio.color} />
                  {due ? <Chip text={due.label} color={due.overdue ? theme.danger : theme.textSecondary} /> : null}
                </View>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenTitle: { fontSize: 24, fontWeight: '700', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  filters: { flexDirection: 'row', gap: 8, padding: 12, borderBottomWidth: 1, flexWrap: 'wrap' },
  filter: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6 },
  list: { padding: 16, gap: 10, paddingBottom: 150 },
  task: { flexDirection: 'row', gap: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14 },
  statusDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tick: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  taskMain: { flex: 1, gap: 6 },
  taskTitle: { fontSize: 15, fontWeight: '500' },
  breadcrumb: { fontSize: 12 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
