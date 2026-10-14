import { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Image } from 'expo-image';
import { avatarSrc } from '@task/core/features/users/avatar';

import { Icon } from '@/components/icon';
import { useTheme, type Theme } from '@/theme';

export function Loading() {
  const theme = useTheme();
  return (
    <View style={[s.centre, { backgroundColor: theme.bgMain }]}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useTheme();
  return (
    <View style={[s.centre, { backgroundColor: theme.bgMain }]}>
      <Text style={[s.errorText, { color: theme.danger }]}>{message}</Text>
      <Pressable onPress={onRetry} style={[s.btn, { backgroundColor: theme.accent }]}>
        <Text style={s.btnText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={s.emptyBox}>
      <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{text}</Text>
    </View>
  );
}

/**
 * The status mark in front of a task: an empty ring while open, a ring with a
 * dot while in progress, and a filled tick once complete — each in the status
 * colour, so the three read apart at a glance.
 */
export function StatusGlyph({
  color,
  done,
  inProgress,
  size = 20,
}: {
  color: string;
  done?: boolean;
  inProgress?: boolean;
  size?: number;
}) {
  const name = done ? 'statusDone' : inProgress ? 'statusProgress' : 'statusOpen';
  // Ionicons draws its circles inside a small margin, so go a little larger to
  // keep the visual size the callers asked for.
  return <Icon name={name} size={Math.round(size * 1.2)} color={color} />;
}

/** The grey "TO DO 6" capsule that heads each status group. */
export function StatusPill({ label, count, color }: { label: string; count: number; color: string }) {
  const theme = useTheme();
  return (
    <View style={s.statusPillRow}>
      <View style={[s.statusPill, { backgroundColor: color }]}>
        <StatusGlyph color="#ffffff" size={12} />
        <Text style={s.statusPillText}>{label.toUpperCase()}</Text>
      </View>
      <Text style={[s.statusCount, { color: theme.textSecondary }]}>{count}</Text>
    </View>
  );
}

/** Inline "+ Add Task" row that closes a group, as in ClickUp's list view. */
export function AddRow({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.addRow, { backgroundColor: pressed ? theme.bgHover : 'transparent' }]}
    >
      <Icon name="add" size={17} color={theme.textSecondary} />
      <Text style={[s.addText, { color: theme.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

/** Collapsible section header with a count, an add button and a chevron. */
export function SectionHeader({
  title,
  count,
  expanded,
  onToggle,
  onAdd,
}: {
  title: string;
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  onAdd?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={s.sectionHeader}>
      <Pressable onPress={onToggle} style={s.sectionTitleWrap} hitSlop={6}>
        <Text style={[s.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
        {count !== undefined ? <Text style={[s.sectionCount, { color: theme.textFaint }]}>{count}</Text> : null}
      </Pressable>
      {onAdd ? (
        <Pressable onPress={onAdd} hitSlop={10} accessibilityLabel={`Add to ${title}`}>
          <Icon name="add" size={20} color={theme.textSecondary} />
        </Pressable>
      ) : null}
      <Pressable onPress={onToggle} hitSlop={10} accessibilityLabel={expanded ? 'Collapse' : 'Expand'}>
        <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={18} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

/** Bottom sheet: rounded white panel, centred title, round ✕ on the right. */
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* The sheet sits in normal flow at the bottom rather than absolutely
          positioned, so KeyboardAvoidingView can lift it clear of the keyboard
          instead of the keyboard covering the inputs. */}
      <KeyboardAvoidingView
        style={s.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={s.backdrop} onPress={onClose} />
        <View style={[s.sheet, { backgroundColor: theme.bgSurface }]}>
          <View style={s.sheetHead}>
            <View style={s.sheetSpacer} />
            <Text style={[s.sheetTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityLabel="Close"
              style={[s.sheetClose, { backgroundColor: theme.bgHover }]}
            >
              <Icon name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={s.sheetBody}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SheetOption({
  label,
  selected,
  color,
  leading,
  onPress,
}: {
  label: string;
  selected?: boolean;
  color?: string;
  // Shown before the label, e.g. a person's profile picture.
  leading?: ReactNode;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.option,
        { borderColor: theme.border, backgroundColor: pressed ? theme.bgHover : 'transparent' },
      ]}
    >
      {leading}
      {color ? <View style={[s.dot, { backgroundColor: color }]} /> : null}
      <Text style={[s.optionText, { color: theme.textPrimary }]}>{label}</Text>
      {selected ? <Icon name="check" size={18} color={theme.accent} /> : null}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  autoFocus,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  const theme = useTheme();
  return (
    <View style={s.field}>
      <Text style={[s.label, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          s.input,
          multiline ? s.inputMultiline : null,
          { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bgCanvas },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textFaint}
        multiline={multiline}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  busy,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.btn,
        s.btnBlock,
        { backgroundColor: theme.accent, opacity: disabled || busy ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={s.btnText}>{label}</Text>}
    </Pressable>
  );
}

export function Chip({ text, color }: { text: string; color: string }) {
  return (
    <View style={[s.chip, { backgroundColor: color + '1f', borderColor: color + '4d' }]}>
      <Text style={[s.chipText, { color }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

/** Rounded square badge holding an emoji or an initial. */
export function Tile({ text, color, size = 32 }: { text: string; color: string; size?: number }) {
  return (
    <View
      style={[s.tile, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: color }]}
    >
      <Text style={[s.tileText, { fontSize: size * 0.42 }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

/** A user's profile picture, or their initials in a coloured circle. */
export function Avatar({
  firstName = '',
  lastName = '',
  avatarUrl,
  color,
  size = 32,
}: {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  color: string;
  size?: number;
}) {
  const src = avatarSrc(avatarUrl);
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (src) {
    return <Image source={{ uri: src }} style={round} contentFit="cover" transition={150} />;
  }
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  return (
    <View style={[s.tile, round, { backgroundColor: color }]}>
      <Text style={[s.tileText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

/**
 * A space's icon field holds an emoji on the web, but older rows carry a name
 * like "rocket" instead, which renders as clipped text in a 32px tile. Anything
 * longer than two code points falls back to the initial.
 */
export function glyphFor(name: string, icon?: string): string {
  if (icon && Array.from(icon).length <= 2) return icon;
  return (name.trim().charAt(0) || '?').toUpperCase();
}

export type { Theme };

const s = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  errorText: { fontSize: 14, textAlign: 'center' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  btn: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12, alignItems: 'center' },
  btnBlock: { alignSelf: 'stretch', paddingVertical: 15 },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },


  statusPillRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusPillText: { color: '#ffffff', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  statusCount: { fontSize: 13, fontWeight: '600' },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 4 },
  addPlus: { fontSize: 16, fontWeight: '400' },
  addText: { fontSize: 14 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  sectionTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionCount: { fontSize: 13, fontWeight: '600' },
  sectionIcon: { fontSize: 18, fontWeight: '500' },

  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sheetSpacer: { width: 30 },
  sheetTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  sheetClose: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { flexGrow: 0 },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
  },
  optionText: { flex: 1, fontSize: 15 },
  dot: { width: 12, height: 12, borderRadius: 6 },

  field: { gap: 7, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },

  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: '600' },

  tile: { alignItems: 'center', justifyContent: 'center' },
  tileText: { color: '#ffffff', fontWeight: '700' },
});
