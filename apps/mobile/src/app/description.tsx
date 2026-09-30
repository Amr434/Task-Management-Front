import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Icon } from '@/components/icon';
import { RichTextEditor } from '@/components/rich-text';
import { useDescriptionDraft } from '@/features/tasks/description-draft';
import { useTheme } from '@/theme';

/**
 * Full-screen description editor, opened from New Task and Task. It sits above
 * the tabs so the floating tab bar does not cover the writing area.
 *
 * Every edit goes straight to the draft store, so leaving by ✓, ✕ or the back
 * gesture all keep what was written; the screen that opened it picks it up.
 */
export default function DescriptionScreen() {
  const theme = useTheme();
  // Read once: the editor owns the text from here on.
  const [initial] = useState(() => useDescriptionDraft.getState().text);
  const placeholder = useDescriptionDraft((s) => s.placeholder);
  const setText = useDescriptionDraft((s) => s.setText);

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.root, { backgroundColor: theme.bgMain }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={close}
          hitSlop={10}
          accessibilityLabel="Close"
          style={[styles.round, { backgroundColor: theme.bgHover }]}
        >
          <Icon name="close" size={20} color={theme.textSecondary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Description</Text>
        <Pressable
          onPress={close}
          hitSlop={10}
          accessibilityLabel="Done"
          style={({ pressed }) => [styles.round, styles.done, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon name="check" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Shrinks the editor above the keyboard so the caret is never hidden under it. */}
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <RichTextEditor
          fill
          autoFocus
          value={initial}
          onChangeText={setText}
          placeholder={placeholder || 'Write a description...'}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontWeight: '700' },
  round: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  // Same purple ✓ as Create Task.
  done: { backgroundColor: '#7c3aed' },
});
