import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { addTagToTask, createTask } from '@task/core/features/tasks/api';
import { Priority, TaskStatus, priorityMeta, type Tag } from '@task/core/features/tasks/types';
import { formatFileSize, uploadAttachment } from '@task/core/features/attachments/api';

import { Icon } from '@/components/icon';
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { DescriptionField } from '@/components/description-field';
import { TagPill, TagSheet } from '@/components/tag-sheet';
import { Chip, Sheet, SheetOption } from '@/components/ui';
import { FileTooLargeError, pickDocument, pickImage, takePhoto, type PickedFile } from '@/features/attachments/pick';
import { STATUS_META, STATUS_ORDER, formatDueDate } from '@/features/tasks/display';
import { useTheme } from '@/theme';

type SheetName = 'status' | 'priority' | 'due' | 'tags' | 'attach' | null;

/**
 * Full-screen task composer. Attachments are collected here and uploaded after
 * the task exists, because the API keys them by task id.
 */
export default function NewTaskScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { projectId, status: statusParam, listName } = useLocalSearchParams<{
    projectId: string;
    status?: string;
    listName?: string;
  }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(
    statusParam !== undefined ? (Number(statusParam) as TaskStatus) : TaskStatus.ToDo
  );
  const [priority, setPriority] = useState<Priority>(Priority.Low);
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [sheet, setSheet] = useState<SheetName>(null);
  // The title field opens with the keyboard up; close it so the sheet is not
  // half hidden behind it.
  const openSheet = (name: Exclude<SheetName, null>) => {
    Keyboard.dismiss();
    setSheet(name);
  };
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);


  const submit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    setProgress(null);
    try {
      const created = await createTask({
        title: trimmed,
        description: description.trim() || undefined,
        projectId: Number(projectId),
        status,
        priority,
        dueDate,
        order: 0,
      });

      // The task exists now, so tags and files can be attached to it. A failure
      // here must not discard the task the user already wrote.
      const failed: string[] = [];
      for (const tag of tags) {
        try {
          await addTagToTask(created.id, tag.id);
        } catch {
          failed.push(`tag "${tag.name}"`);
        }
      }
      for (let i = 0; i < files.length; i += 1) {
        setProgress(`Uploading ${i + 1} of ${files.length}...`);
        try {
          await uploadAttachment(created.id, files[i].file);
        } catch {
          failed.push(files[i].name);
        }
      }

      if (failed.length) {
        Alert.alert('Task created', `But these could not be added: ${failed.join(', ')}`);
      }
      router.back();
    } catch (err) {
      Alert.alert('Could not create the task', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [title, description, projectId, status, priority, dueDate, files, tags]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        title: 'New Task',
        headerRight: () => (
          <Pressable
            onPress={submit}
            disabled={!title.trim() || busy}
            style={({ pressed }) => ([
              styles.headerCheckBtn,
              (!title.trim() || busy) && styles.headerCheckBtnDisabled,
              pressed && { opacity: 0.7 },
            ])}
            accessibilityLabel="Create Task"
          >
            {busy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="check" size={20} color="#fff" />
            )}
          </Pressable>
        ),
      });
    }, [navigation, title, busy, submit])
  );

  const addFile = async (pick: () => Promise<PickedFile | null>) => {
    setSheet(null);
    try {
      const picked = await pick();
      if (picked) setFiles((prev) => [...prev, picked]);
    } catch (err) {
      Alert.alert(
        err instanceof FileTooLargeError ? 'File too large' : 'Could not attach',
        err instanceof Error ? err.message : 'Please try again.'
      );
    }
  };

  const statusMeta = STATUS_META[status];
  const prio = priorityMeta(priority);
  const due = formatDueDate(dueDate);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bgMain }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        {listName ? (
          <Text style={[styles.breadcrumb, { color: theme.textSecondary }]} numberOfLines={1}>
            in {listName}
          </Text>
        ) : null}

        <TextInput
          style={[styles.titleInput, { color: theme.textPrimary }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Task name"
          placeholderTextColor={theme.textFaint}
          autoFocus
          multiline
        />

        <View style={styles.chipRow}>
          <MetaChip label={statusMeta.label} color={statusMeta.color} onPress={() => openSheet('status')} />
          <MetaChip label={prio.label} color={prio.color} onPress={() => openSheet('priority')} />
          <MetaChip
            label={due ? due.label : 'Due date'}
            color={due ? (due.overdue ? theme.danger : theme.accent) : theme.textSecondary}
            onPress={() => openSheet('due')}
          />
          <MetaChip
            label={tags.length ? `Tags (${tags.length})` : 'Tags'}
            color={tags.length ? theme.accent : theme.textSecondary}
            onPress={() => openSheet('tags')}
          />
        </View>

        {tags.length ? (
          <Pressable onPress={() => openSheet('tags')} style={styles.tagRow}>
            {tags.map((t) => (
              <TagPill key={t.id} tag={t} />
            ))}
          </Pressable>
        ) : null}

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Description</Text>
        <DescriptionField
          value={description}
          onChange={setDescription}
          placeholder="Add a description, steps, notes..."
        />

        <View style={styles.attachHead}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginBottom: 0 }]}>
            Attachments{files.length ? ` (${files.length})` : ''}
          </Text>
          <Pressable onPress={() => openSheet('attach')} hitSlop={8} style={styles.attachAdd}>
            <Icon name="add" size={17} color={theme.accent} />
            <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 14 }}>Add</Text>
          </Pressable>
        </View>

        {files.map((file, index) => (
          <View
            key={`${file.name}-${index}`}
            style={[styles.file, { borderColor: theme.border, backgroundColor: theme.bgCanvas }]}
          >
            <Icon
              name={file.mimeType.startsWith('image/') ? 'grid' : 'folder'}
              size={18}
              color={theme.textSecondary}
            />
            <View style={styles.fileText}>
              <Text style={[styles.fileName, { color: theme.textPrimary }]} numberOfLines={1}>
                {file.name}
              </Text>
              {file.size !== undefined ? (
                <Text style={[styles.fileSize, { color: theme.textSecondary }]}>{formatFileSize(file.size)}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
              hitSlop={10}
              accessibilityLabel={`Remove ${file.name}`}
            >
              <Icon name="close" size={18} color={theme.textFaint} />
            </Pressable>
          </View>
        ))}

        {files.length === 0 ? (
          <Text style={[styles.noFiles, { color: theme.textFaint }]}>
            Attach a file or take a photo — up to 25 MB each.
          </Text>
        ) : null}
      </ScrollView>

      {progress ? (
        <View style={[styles.progressBar, { borderTopColor: theme.border, backgroundColor: theme.bgMain }]}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{progress}</Text>
        </View>
      ) : null}

      <Sheet visible={sheet === 'status'} title="Status" onClose={() => setSheet(null)}>
        {STATUS_ORDER.map((sv) => (
          <SheetOption
            key={sv}
            label={STATUS_META[sv].label}
            color={STATUS_META[sv].color}
            selected={status === sv}
            onPress={() => {
              setStatus(sv);
              setSheet(null);
            }}
          />
        ))}
      </Sheet>

      <Sheet visible={sheet === 'priority'} title="Priority" onClose={() => setSheet(null)}>
        {[Priority.Urgent, Priority.High, Priority.Medium, Priority.Low].map((p) => (
          <SheetOption
            key={p}
            label={priorityMeta(p).label}
            color={priorityMeta(p).color}
            selected={priority === p}
            onPress={() => {
              setPriority(p);
              setSheet(null);
            }}
          />
        ))}
      </Sheet>

      <DatePickerSheet
        visible={sheet === 'due'}
        value={dueDate}
        onClose={() => setSheet(null)}
        onSave={setDueDate}
      />

      <TagSheet
        visible={sheet === 'tags'}
        selected={tags}
        onToggle={(tag, add) =>
          setTags((prev) => (add ? [...prev, tag] : prev.filter((t) => t.id !== tag.id)))
        }
        onClose={() => setSheet(null)}
      />

      <Sheet visible={sheet === 'attach'} title="Add attachment" onClose={() => setSheet(null)}>
        <SheetOption label="Take a photo" onPress={() => addFile(takePhoto)} />
        <SheetOption label="Choose from photos" onPress={() => addFile(pickImage)} />
        <SheetOption label="Choose a file" onPress={() => addFile(pickDocument)} />
      </Sheet>
    </KeyboardAvoidingView>
  );
}

function MetaChip({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <Chip text={label} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 32 },
  breadcrumb: { fontSize: 13, marginBottom: 6 },
  titleInput: { fontSize: 22, fontWeight: '700', paddingVertical: 6, lineHeight: 29 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: -12, marginBottom: 22 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  attachHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 10 },
  attachAdd: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  file: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  fileText: { flex: 1, gap: 2 },
  fileName: { fontSize: 14, fontWeight: '600' },
  fileSize: { fontSize: 12 },
  noFiles: { fontSize: 13 },
  headerCheckBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  headerCheckBtnDisabled: {
    opacity: 0.4,
  },
  progressBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
