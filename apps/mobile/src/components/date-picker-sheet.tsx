import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Sheet } from '@/components/ui';
import { atNoon } from '@/features/tasks/display';
import { useTheme } from '@/theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a: Date | null, b: Date) =>
  !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Six full weeks starting on the Sunday on or before the 1st, like ClickUp's grid. */
function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function quickPicks(): { label: string; icon: IconName; date: Date }[] {
  const today = startOfDay(new Date());
  return [
    { label: 'Today', icon: 'today', date: today },
    { label: 'Tomorrow', icon: 'tomorrow', date: addDays(today, 1) },
    // The grid's weeks run Sunday to Saturday.
    { label: 'This week', icon: 'thisWeek', date: addDays(today, 6 - today.getDay()) },
    { label: 'Next week', icon: 'nextWeek', date: addDays(today, 7 - today.getDay()) },
  ];
}

/**
 * ClickUp's "Choose dates" sheet: quick picks, a month calendar, Clear and Save.
 * Only a due date — the API has no start date or recurrence yet.
 */
export function DatePickerSheet({
  visible,
  value,
  onClose,
  onSave,
}: {
  visible: boolean;
  value?: string;
  onClose: () => void;
  onSave: (value: string | undefined) => void;
}) {
  const theme = useTheme();
  const [selected, setSelected] = useState<Date | null>(null);
  const [month, setMonth] = useState(() => startOfDay(new Date()));

  // Start from the task's current date each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    const current = value ? new Date(value) : null;
    const valid = current && !Number.isNaN(current.getTime()) ? startOfDay(current) : null;
    setSelected(valid);
    setMonth(valid ?? startOfDay(new Date()));
  }, [visible, value]);

  const pick = (date: Date) => {
    setSelected(date);
    setMonth(date);
  };

  const shiftMonth = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  const save = () => {
    onSave(selected ? atNoon(selected) : undefined);
    onClose();
  };

  const clear = () => {
    onSave(undefined);
    onClose();
  };

  const today = startOfDay(new Date());
  const grid = monthGrid(month);

  return (
    <Sheet visible={visible} title="Choose dates" onClose={onClose}>
      <View style={[styles.field, { borderColor: theme.accent }]}>
        <Icon name="calendar" size={20} color={selected ? theme.textPrimary : theme.textFaint} />
        <Text style={[styles.fieldText, { color: selected ? theme.textPrimary : theme.textFaint }]}>
          {selected
            ? selected.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
            : 'Set due date'}
        </Text>
        {selected ? (
          <Pressable onPress={() => setSelected(null)} hitSlop={10} accessibilityLabel="Remove date">
            <Icon name="close" size={18} color={theme.textFaint} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.quickRow}>
        {quickPicks().map((q) => {
          const on = sameDay(selected, q.date);
          return (
            <Pressable
              key={q.label}
              onPress={() => pick(q.date)}
              style={({ pressed }) => [
                styles.quick,
                {
                  borderColor: on ? theme.accent : theme.border,
                  backgroundColor: on ? theme.accentMuted : pressed ? theme.bgHover : 'transparent',
                },
              ]}
            >
              <Icon name={q.icon} size={15} color={on ? theme.accent : theme.textSecondary} />
              <Text style={[styles.quickText, { color: on ? theme.accent : theme.textPrimary }]}>{q.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.calendar, { borderTopColor: theme.border }]}>
        <View style={styles.monthRow}>
          <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>
            {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={10} style={styles.monthBtn} accessibilityLabel="Previous month">
            <Icon name="chevronUp" size={22} color={theme.textSecondary} />
          </Pressable>
          <Pressable onPress={() => shiftMonth(1)} hitSlop={10} style={styles.monthBtn} accessibilityLabel="Next month">
            <Icon name="chevronDown" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.week}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={[styles.weekday, { color: theme.textSecondary }]}>
              {d}
            </Text>
          ))}
        </View>

        {[0, 1, 2, 3, 4, 5].map((row) => (
          <View key={row} style={styles.week}>
            {grid.slice(row * 7, row * 7 + 7).map((day) => {
              const inMonth = day.getMonth() === month.getMonth();
              const isSelected = sameDay(selected, day);
              const isToday = sameDay(today, day);
              const fill = isSelected ? theme.accent : isToday ? theme.danger : 'transparent';
              return (
                <Pressable
                  key={day.toISOString()}
                  onPress={() => pick(day)}
                  style={styles.dayCell}
                  accessibilityLabel={day.toDateString()}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[styles.dayCircle, { backgroundColor: fill }]}>
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color:
                            isSelected || isToday ? '#ffffff' : inMonth ? theme.textPrimary : theme.textFaint,
                          fontWeight: isSelected || isToday ? '700' : '400',
                        },
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Pressable
          onPress={clear}
          style={({ pressed }) => [styles.btn, styles.clear, { borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.btnText, { color: theme.textSecondary }]}>Clear</Text>
        </Pressable>
        <Pressable
          onPress={save}
          style={({ pressed }) => [styles.btn, { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[styles.btnText, { color: '#ffffff' }]}>Save</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  fieldText: { flex: 1, fontSize: 16 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 14 },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  quickText: { fontSize: 14 },
  calendar: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
  monthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  monthTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  monthBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 13, paddingVertical: 8 },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dayCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 15 },
  footer: { flexDirection: 'row', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginTop: 8 },
  btn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  clear: { borderWidth: 1 },
  btnText: { fontSize: 16, fontWeight: '600' },
});
