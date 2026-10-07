import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/icon';
import { MarkdownPreview } from '@/components/markdown-preview';
import { useDescriptionDraft } from '@/features/tasks/description-draft';
import { useTheme } from '@/theme';

/**
 * The description as it reads, formatted. Tapping it opens the full-screen
 * editor; what is written there flows back through the draft store.
 */
export function DescriptionField({
  value,
  onChange,
  placeholder = 'Add a description',
}: {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}) {
  const theme = useTheme();
  const [session, setSession] = useState<number | null>(null);
  const draft = useDescriptionDraft((s) => (session !== null && s.session === session ? s.text : null));

  useEffect(() => {
    if (draft !== null && draft !== value) onChange(draft);
  }, [draft]);

  const open = () => {
    setSession(useDescriptionDraft.getState().begin(value, placeholder));
    router.push('/description');
  };

  const empty = !value.trim();

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={empty ? placeholder : 'Edit description'}
      style={({ pressed }) => [
        styles.box,
        { borderColor: theme.border, backgroundColor: pressed ? theme.bgHover : theme.bgCanvas },
      ]}
    >
      {empty ? (
        <View style={styles.emptyRow}>
          <Icon name="list" size={18} color={theme.textFaint} />
          <Text style={[styles.placeholder, { color: theme.textFaint }]}>{placeholder}</Text>
        </View>
      ) : (
        <>
          {/* Long descriptions are clipped here; the editor shows all of it. */}
          <View style={styles.clip}>
            <MarkdownPreview markdown={value} />
          </View>
          <Text style={[styles.hint, { color: theme.accent }]}>Tap to edit</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 56 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  placeholder: { fontSize: 15 },
  clip: { maxHeight: 220, overflow: 'hidden' },
  hint: { fontSize: 12, fontWeight: '600', marginTop: 8 },
});
