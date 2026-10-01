import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { useTaskSearch } from '@task/core/features/tasks/hooks/useTaskSearch';
import { priorityMeta } from '@task/core/features/tasks/types';
import { en } from '@task/core/i18n/dictionaries/en';

import { Icon } from '@/components/icon';
import { Chip } from '@/components/ui';
import { useTheme } from '@/theme';

/**
 * Task matches for the Home search box: by name or number ("2", "#2",
 * "task 2"), only tasks the user can access. Same shared search as the web.
 */
export function TaskSearchResults({ query }: { query: string }) {
  const theme = useTheme();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { results, isSearching, noResults, error } = useTaskSearch(query);

  if (!query.trim()) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Text style={[styles.head, { color: theme.textPrimary }]}>Tasks</Text>
        {isSearching ? <ActivityIndicator size="small" color={theme.accent} /> : null}
      </View>

      {error ? (
        <Text style={[styles.note, { color: theme.danger }]}>{error}</Text>
      ) : noResults ? (
        <Text style={[styles.note, { color: theme.textSecondary }]}>{en.noTasksFound}</Text>
      ) : (
        results.map((task) => {
          const crumb = [task.spaceName, task.projectName].filter(Boolean).join(' / ');
          const mine = task.assignees?.some((a) => a.id === currentUserId);
          return (
            <Pressable
              key={task.id}
              onPress={() =>
                router.push({
                  pathname: '/task/[id]',
                  params: { id: String(task.id), projectId: String(task.projectId) },
                })
              }
              style={({ pressed }) => [
                styles.row,
                { borderColor: theme.border, backgroundColor: pressed ? theme.bgHover : theme.bgSurface },
              ]}
            >
              <Text style={[styles.number, { color: theme.accent }]}>#{task.id}</Text>
              <View style={styles.text}>
                <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
                  {task.title}
                </Text>
                {crumb ? (
                  <Text style={[styles.crumb, { color: theme.textSecondary }]} numberOfLines={1}>
                    {crumb}
                  </Text>
                ) : null}
              </View>
              {mine ? <Chip text="You" color={theme.accent} /> : null}
              <Icon name="flag" size={15} color={priorityMeta(task.priority).color} />
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 16 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  head: { fontSize: 15, fontWeight: '700' },
  note: { fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  number: { fontSize: 13, fontWeight: '700', minWidth: 32 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '500' },
  crumb: { fontSize: 12 },
});
