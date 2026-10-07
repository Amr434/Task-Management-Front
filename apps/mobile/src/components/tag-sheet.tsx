import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { findOrCreateTag, getTags } from '@task/core/features/tasks/api';
import type { Tag } from '@task/core/features/tasks/types';

import { Icon } from '@/components/icon';
import { Sheet } from '@/components/ui';
import { useTheme } from '@/theme';

/**
 * Pick tags for a task, or type a new name to create one. Tags are global, so
 * creating one here makes it available on every task.
 *
 * The sheet does not save anything to the task itself: it reports each toggle,
 * and the screen decides whether that is an API call (existing task) or a
 * local selection attached after creation (new task).
 */
export function TagSheet({
  visible,
  selected,
  onToggle,
  onClose,
}: {
  visible: boolean;
  selected: Tag[];
  onToggle: (tag: Tag, add: boolean) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setLoading(true);
    getTags()
      .then(setTags)
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const trimmed = query.trim();
  const shown = tags.filter((t) => t.name.toLowerCase().includes(trimmed.toLowerCase()));
  const exact = tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
  const isSelected = (tag: Tag) => selected.some((s) => s.id === tag.id);

  const create = async () => {
    if (!trimmed) return;
    setCreating(true);
    try {
      const tag = await findOrCreateTag(trimmed, tags);
      setTags((prev) => (prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]));
      if (!isSelected(tag)) onToggle(tag, true);
      setQuery('');
    } catch (err) {
      Alert.alert('Could not create tag', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sheet visible={visible} title="Tags" onClose={onClose}>
      <View style={[styles.search, { borderColor: theme.border, backgroundColor: theme.bgCanvas }]}>
        <Icon name="tag" size={18} color={theme.textFaint} />
        <TextInput
          style={[styles.input, { color: theme.textPrimary }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search or create a tag"
          placeholderTextColor={theme.textFaint}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (trimmed && !exact) create();
          }}
          autoCapitalize="none"
        />
      </View>

      {trimmed && !exact ? (
        <Pressable
          onPress={create}
          disabled={creating}
          style={({ pressed }) => [styles.row, { borderColor: theme.border, opacity: pressed ? 0.6 : 1 }]}
        >
          {creating ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Icon name="add" size={20} color={theme.accent} />
          )}
          <Text style={[styles.name, { color: theme.accent }]}>Create tag “{trimmed}”</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loading} color={theme.accent} />
      ) : shown.length === 0 && !trimmed ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No tags yet. Type a name to create one.</Text>
      ) : (
        shown.map((tag) => {
          const on = isSelected(tag);
          return (
            <Pressable
              key={tag.id}
              onPress={() => onToggle(tag, !on)}
              style={({ pressed }) => [
                styles.row,
                { borderColor: theme.border, backgroundColor: pressed ? theme.bgHover : 'transparent' },
              ]}
            >
              <View style={[styles.swatch, { backgroundColor: tag.colorHex }]} />
              <Text style={[styles.name, { color: theme.textPrimary }]}>{tag.name}</Text>
              {on ? <Icon name="check" size={20} color={theme.accent} /> : null}
            </Pressable>
          );
        })
      )}
    </Sheet>
  );
}

/** A tag as a coloured pill. */
export function TagPill({ tag }: { tag: Tag }) {
  return (
    <View style={[styles.pill, { backgroundColor: tag.colorHex + '26', borderColor: tag.colorHex + '66' }]}>
      <Text style={[styles.pillText, { color: tag.colorHex }]} numberOfLines={1}>
        {tag.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 6,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  swatch: { width: 14, height: 14, borderRadius: 4 },
  name: { flex: 1, fontSize: 15 },
  loading: { marginVertical: 20 },
  empty: { fontSize: 14, paddingVertical: 16 },
  pill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 12, fontWeight: '600' },
});
