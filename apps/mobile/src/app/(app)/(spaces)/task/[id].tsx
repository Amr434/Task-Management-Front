import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import {
  addTagToTask,
  assignUserToTask,
  createTask,
  deleteTask,
  getProjectMembers,
  getTasksByProject,
  patchTask,
  removeTagFromTask,
  removeUserFromTask,
} from '@task/core/features/tasks/api';
import {
  Priority,
  TaskStatus,
  avatarColor,
  priorityMeta,
  userDisplayName,
  type Tag,
  type TaskItem,
  type User,
} from '@task/core/features/tasks/types';

import { DatePickerSheet } from '@/components/date-picker-sheet';
import { DescriptionField } from '@/components/description-field';
import { Icon } from '@/components/icon';
import { TaskComments } from '@/components/task-comments';
import { TagPill, TagSheet } from '@/components/tag-sheet';
import { TaskHistory } from '@/components/task-history';
import { Avatar, Chip, ErrorState, Field, Loading, PrimaryButton, Sheet, SheetOption, StatusGlyph } from '@/components/ui';
import { STATUS_META, STATUS_ORDER, formatDueDate, nextStatus } from '@/features/tasks/display';
import { useTheme } from '@/theme';

type SheetName = 'status' | 'priority' | 'due' | 'assignee' | 'tags' | 'subtask' | null;

export default function TaskScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { id, projectId } = useLocalSearchParams<{ id: string; projectId?: string }>();
  const taskId = Number(id);

  const [task, setTask] = useState<TaskItem | null>(null);
  const [subtasks, setSubtasks] = useState<TaskItem[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetName>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);

  // Bumped after every successful save so the history reloads.
  const [historyVersion, setHistoryVersion] = useState(0);
  const bumpHistory = () => setHistoryVersion((v) => v + 1);

  // There is no GET /Tasks/{id} on the API, so the task and its children are
  // found within the project's list. projectId travels in the route params.
  const load = useCallback(async () => {
    setError(null);
    try {
      const pid = Number(projectId);
      if (!pid) throw new Error('Missing project for this task.');
      const list = await getTasksByProject(pid);
      const found = list.find((t) => t.id === taskId);
      if (!found) throw new Error('This task no longer exists.');
      setTask(found);
      setSubtasks(list.filter((t) => t.parentTaskId === taskId));
      setTitle(found.title);
      setDescription(found.description ?? '');
      try {
        setMembers(await getProjectMembers(pid));
      } catch {
        // Members are a nice-to-have; the rest of the screen still works.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the task');
    }
  }, [projectId, taskId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // Every edit applies locally first. The PUT response comes back with empty
  // tags and assignees, so it must never replace what is on screen.
  const apply = async (patch: Partial<TaskItem>) => {
    if (!task) return;
    const previous = task;
    setTask({ ...task, ...patch } as TaskItem);
    try {
      await patchTask(previous, patch as never);
      bumpHistory();
    } catch (err) {
      setTask(previous);
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const saveText = async () => {
    if (!task) return;
    Keyboard.dismiss();
    setSaving(true);
    await apply({ title: title.trim() || task.title, description: description.trim() || undefined });
    setSaving(false);
  };

  // Held in a ref so the header effect below depends only on whether there is
  // something to save, not on every keystroke.
  const saveRef = useRef(saveText);
  saveRef.current = saveText;

  const addSubtask = async () => {
    const trimmed = subtaskTitle.trim();
    if (!trimmed || !task) return;
    setAddingSubtask(true);
    try {
      const created = await createTask({
        title: trimmed,
        projectId: task.projectId,
        status: TaskStatus.ToDo,
        priority: Priority.Low,
        order: subtasks.length,
        parentTaskId: task.id,
      });
      setSubtasks((prev) => [...prev, created]);
      setSubtaskTitle('');
    } catch (err) {
      Alert.alert('Could not add subtask', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setAddingSubtask(false);
    }
  };

  const toggleSubtask = async (sub: TaskItem) => {
    const status = nextStatus(sub.status);
    setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? { ...s, status } : s)));
    try {
      await patchTask(sub, { status });
    } catch {
      setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? { ...s, status: sub.status } : s)));
    }
  };

  const removeSubtask = (sub: TaskItem) => {
    Alert.alert('Delete subtask', `Delete "${sub.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const previous = subtasks;
          setSubtasks((prev) => prev.filter((s) => s.id !== sub.id));
          try {
            await deleteTask(sub.id);
          } catch (err) {
            setSubtasks(previous);
            Alert.alert('Could not delete', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const toggleAssignee = async (user: User) => {
    if (!task) return;
    const assigned = task.assignees?.some((a) => a.id === user.id);
    const previous = task.assignees ?? [];
    setTask({
      ...task,
      assignees: assigned ? previous.filter((a) => a.id !== user.id) : [...previous, user],
    });
    try {
      if (assigned) await removeUserFromTask(task.id, user.id);
      else await assignUserToTask(task.id, user.id);
      bumpHistory();
    } catch (err) {
      setTask({ ...task, assignees: previous });
      Alert.alert('Could not update assignees', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const toggleTag = async (tag: Tag, add: boolean) => {
    if (!task) return;
    const previous = task.tags ?? [];
    setTask({ ...task, tags: add ? [...previous, tag] : previous.filter((t) => t.id !== tag.id) });
    try {
      if (add) await addTagToTask(task.id, tag.id);
      else await removeTagFromTask(task.id, tag.id);
      bumpHistory();
    } catch (err) {
      setTask({ ...task, tags: previous });
      Alert.alert('Could not update tags', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const confirmDelete = () => {
    if (!task) return;
    Alert.alert('Delete task', `Delete "${task.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(task.id);
            router.back();
          } catch (err) {
            Alert.alert('Could not delete', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const dirty =
    !!task && (title.trim() !== task.title || (description.trim() || undefined) !== task.description);

  // Always rendered, greyed out until there is something to save — a button
  // that appears and disappears reads as a missing button.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => saveRef.current()}
          disabled={saving || !dirty}
          hitSlop={10}
          accessibilityLabel="Save changes"
          style={({ pressed }) => [
            {
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: dirty ? theme.accent : 'transparent',
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={dirty ? '#ffffff' : theme.accent} />
          ) : (
            <Text style={{ color: dirty ? '#ffffff' : theme.textFaint, fontWeight: '700', fontSize: 15 }}>
              Save
            </Text>
          )}
        </Pressable>
      ),
    });
  }, [dirty, saving, navigation, theme.accent, theme.textFaint]);

  if (loading) return <Loading />;
  if (error || !task) return <ErrorState message={error ?? 'Task not found'} onRetry={load} />;

  const status = STATUS_META[task.status] ?? STATUS_META[TaskStatus.ToDo];
  const prio = priorityMeta(task.priority);
  const due = formatDueDate(task.dueDate);
  const doneCount = subtasks.filter((s) => s.status === TaskStatus.Complete).length;

  return (
    // Without this the keyboard covers whatever sits below the field being
    // edited — the Save button and the subtask input are both down there.
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
      {/* Taps that no control handles fall through to here and close the keyboard. */}
      <Pressable onPress={Keyboard.dismiss} accessible={false}>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="Task title" />
      <Text style={[styles.editorLabel, { color: theme.textSecondary }]}>Description</Text>
      <DescriptionField value={description} onChange={setDescription} placeholder="Add more detail..." />

      <View style={styles.rows}>
        <DetailRow label="Status" onPress={() => setSheet('status')}>
          <Chip text={status.label} color={status.color} />
        </DetailRow>
        <DetailRow label="Priority" onPress={() => setSheet('priority')}>
          <Chip text={prio.label} color={prio.color} />
        </DetailRow>
        <DetailRow label="Due date" onPress={() => setSheet('due')}>
          <Chip
            text={due ? due.label : 'None'}
            color={due ? (due.overdue ? theme.danger : theme.textSecondary) : theme.textSecondary}
          />
        </DetailRow>
        <DetailRow label="Assignees" onPress={() => setSheet('assignee')}>
          {task.assignees?.length ? (
            <View style={styles.chips}>
              {task.assignees.map((a) => (
                <View key={a.id} style={styles.person}>
                  <Avatar
                    firstName={a.firstName}
                    lastName={a.lastName}
                    avatarUrl={a.avatarUrl}
                    color={avatarColor(a)}
                    size={22}
                  />
                  <Chip text={userDisplayName(a)} color={theme.accent} />
                </View>
              ))}
            </View>
          ) : (
            <Chip text="Nobody" color={theme.textSecondary} />
          )}
        </DetailRow>
        <DetailRow label="Tags" onPress={() => setSheet('tags')}>
          {task.tags?.length ? (
            <View style={styles.chips}>
              {task.tags.map((t) => (
                <TagPill key={t.id} tag={t} />
              ))}
            </View>
          ) : (
            <Chip text="Add tags" color={theme.textSecondary} />
          )}
        </DetailRow>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Subtasks{' '}
          {subtasks.length ? (
            <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>
              {doneCount}/{subtasks.length}
            </Text>
          ) : null}
        </Text>

        {subtasks.map((sub) => {
          const meta = STATUS_META[sub.status] ?? STATUS_META[TaskStatus.ToDo];
          const subDone = sub.status === TaskStatus.Complete;
          return (
            <View key={sub.id} style={[styles.subRow, { borderBottomColor: theme.border }]}>
              <Pressable hitSlop={10} onPress={() => toggleSubtask(sub)} accessibilityLabel={`Mark as ${meta.label}`}>
                <StatusGlyph
                  color={meta.color}
                  done={subDone}
                  inProgress={sub.status === TaskStatus.InProgress}
                  size={19}
                />
              </Pressable>
              <Pressable
                style={styles.subMain}
                onPress={() =>
                  router.push({
                    pathname: '/task/[id]',
                    params: { id: String(sub.id), projectId: String(sub.projectId) },
                  })
                }
              >
                <Text
                  style={[
                    styles.subTitle,
                    { color: theme.textPrimary },
                    subDone ? { textDecorationLine: 'line-through', color: theme.textSecondary } : null,
                  ]}
                  numberOfLines={2}
                >
                  {sub.title}
                </Text>
              </Pressable>
              <Pressable hitSlop={10} onPress={() => removeSubtask(sub)} accessibilityLabel="Delete subtask">
                <Icon name="trash" size={17} color={theme.textFaint} />
              </Pressable>
            </View>
          );
        })}

        {/* The inline input sat at the bottom of the page, under the Android
            keyboard, so the text and its Add button could not be seen. A sheet
            is lifted above the keyboard instead. */}
        <Pressable
          onPress={() => setSheet('subtask')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.subAdd,
            { borderColor: theme.border, backgroundColor: pressed ? theme.bgHover : theme.bgCanvas },
          ]}
        >
          <Icon name="add" size={20} color={theme.accent} />
          <Text style={[styles.subAddText, { color: theme.accent }]}>Add subtask</Text>
        </Pressable>
      </View>

      <TaskComments taskId={taskId} onChange={bumpHistory} />
      <TaskHistory taskId={task.id} version={historyVersion} />

      <Pressable onPress={confirmDelete} style={({ pressed }) => [styles.delete, { opacity: pressed ? 0.6 : 1 }]}>
        <Text style={{ color: theme.danger, fontWeight: '600' }}>Delete task</Text>
      </Pressable>

      <Sheet visible={sheet === 'status'} title="Status" onClose={() => setSheet(null)}>
        {STATUS_ORDER.map((sv) => (
          <SheetOption
            key={sv}
            label={STATUS_META[sv].label}
            color={STATUS_META[sv].color}
            selected={task.status === sv}
            onPress={() => {
              setSheet(null);
              apply({ status: sv });
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
            selected={task.priority === p}
            onPress={() => {
              setSheet(null);
              apply({ priority: p });
            }}
          />
        ))}
      </Sheet>

      <DatePickerSheet
        visible={sheet === 'due'}
        value={task.dueDate}
        onClose={() => setSheet(null)}
        onSave={(dueDate) => apply({ dueDate })}
      />

      <TagSheet
        visible={sheet === 'tags'}
        selected={task.tags ?? []}
        onToggle={toggleTag}
        onClose={() => setSheet(null)}
      />

      <Sheet visible={sheet === 'subtask'} title="Add subtask" onClose={() => setSheet(null)}>
        <TextInput
          style={[styles.subInput, { color: theme.textPrimary, borderColor: theme.accent, backgroundColor: theme.bgCanvas }]}
          value={subtaskTitle}
          onChangeText={setSubtaskTitle}
          placeholder="Subtask name"
          placeholderTextColor={theme.textFaint}
          autoFocus
          returnKeyType="done"
          submitBehavior="submit"
          onSubmitEditing={addSubtask}
          editable={!addingSubtask}
        />
        <Text style={[styles.subHint, { color: theme.textSecondary }]}>
          The sheet stays open so you can add several in a row.
        </Text>
        <PrimaryButton
          label="Add subtask"
          onPress={addSubtask}
          disabled={!subtaskTitle.trim()}
          busy={addingSubtask}
        />
      </Sheet>

      <Sheet visible={sheet === 'assignee'} title="Assignees" onClose={() => setSheet(null)}>
        {members.length === 0 ? (
          <Text style={{ color: theme.textSecondary, paddingVertical: 12 }}>
            No members available for this list.
          </Text>
        ) : (
          members.map((m) => (
            <SheetOption
              key={m.id}
              label={userDisplayName(m)}
              leading={
                <Avatar
                  firstName={m.firstName}
                  lastName={m.lastName}
                  avatarUrl={m.avatarUrl}
                  color={avatarColor(m)}
                  size={26}
                />
              }
              selected={task.assignees?.some((a) => a.id === m.id)}
              onPress={() => toggleAssignee(m)}
            />
          ))
        )}
      </Sheet>
      </Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DetailRow({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.detailRow,
        { borderColor: theme.border, backgroundColor: pressed ? theme.bgHover : 'transparent' },
      ]}
    >
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.detailValue}>{children}</View>
      <Icon name="chevronRight" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 140 },
  editorLabel: { fontSize: 13, fontWeight: '600', marginBottom: 7 },
  rows: { marginTop: 18 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  detailLabel: { fontSize: 14, width: 88 },
  detailValue: { flex: 1, alignItems: 'flex-end' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' },
  person: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  section: { marginTop: 26 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  sectionCount: { fontSize: 13, fontWeight: '600' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  subMain: { flex: 1 },
  subTitle: { fontSize: 14 },
  subAdd: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 46, marginTop: 12 },
  subAddText: { fontSize: 15, fontWeight: '600' },
  subInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, height: 50, fontSize: 16 },
  subHint: { fontSize: 12, marginTop: 8, marginBottom: 14 },
  delete: { marginTop: 30, alignItems: 'center', paddingVertical: 14 },
});
