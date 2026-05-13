import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { radius, fontSizes, spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const YEAR_ITEM_HEIGHT = 44;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function parseISO(iso: string): { year: number; month: number; day: number } | null {
  if (!iso || iso.length < 10) return null;
  const parts = iso.split('-').map(Number);
  if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  return { year: parts[0], month: parts[1] - 1, day: parts[2] };
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplay(iso: string): string {
  const p = parseISO(iso);
  if (!p) return '';
  return `${MONTHS_FULL[p.month]} ${p.day}, ${p.year}`;
}

export interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
}: DatePickerFieldProps) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const today = new Date();

  const parsed = parseISO(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear() - 25);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const display = formatDisplay(value);
  const cellSize = Math.floor((windowWidth - spacing.xl * 2 - spacing.sm * 2) / 7);

  const navigate = (dir: 1 | -1) => {
    setViewMonth((m) => {
      const next = m + dir;
      if (next > 11) { setViewYear((y) => y + 1); return 0; }
      if (next < 0) { setViewYear((y) => y - 1); return 11; }
      return next;
    });
  };

  const selectDay = (day: number) => {
    void Haptics.selectionAsync();
    onChange(toISO(viewYear, viewMonth, day));
    setOpen(false);
  };

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay = firstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = Array.from(
    { length: startDay + totalDays },
    (_, i) => (i < startDay ? null : i - startDay + 1)
  );
  while (cells.length % 7 !== 0) cells.push(null);

  const currentYear = today.getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const yearIndex = years.indexOf(viewYear);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text_secondary }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: colors.bg_elevated,
            borderColor: open ? colors.accent_rose : colors.glass_border,
          },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Ionicons
          name="calendar-outline"
          size={16}
          color={open ? colors.accent_rose : colors.text_muted}
          style={styles.calIcon}
        />
        <Text style={[styles.triggerText, { color: display ? colors.text_primary : colors.text_muted }]}>
          {display || placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.text_muted} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { setOpen(false); setShowYearPicker(false); }}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: 'rgba(13,6,16,0.88)' }]}
          onPress={() => { setOpen(false); setShowYearPicker(false); }}
        >
          <Pressable
            style={[
              styles.calendar,
              { backgroundColor: colors.bg_elevated, borderColor: colors.glass_border },
            ]}
          >
            {showYearPicker ? (
              <View style={styles.yearPickerContainer}>
                <View style={[styles.yearPickerHeader, { borderBottomColor: colors.glass_border }]}>
                  <Text style={[styles.yearPickerTitle, { color: colors.text_secondary }]}>
                    Select Year
                  </Text>
                  <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                    <Ionicons name="close" size={20} color={colors.text_muted} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={years}
                  keyExtractor={(item) => String(item)}
                  initialScrollIndex={yearIndex >= 0 ? yearIndex : 0}
                  getItemLayout={(_, index) => ({
                    length: YEAR_ITEM_HEIGHT,
                    offset: YEAR_ITEM_HEIGHT * index,
                    index,
                  })}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: y }) => {
                    const isSelected = y === viewYear;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.yearOption,
                          isSelected && { backgroundColor: 'rgba(255,61,127,0.10)' },
                        ]}
                        onPress={() => { setViewYear(y); setShowYearPicker(false); }}
                      >
                        <Text
                          style={[
                            styles.yearOptionText,
                            { color: isSelected ? colors.accent_rose : colors.text_primary },
                          ]}
                        >
                          {y}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            ) : (
              <>
                {/* Month / year header */}
                <View style={styles.calHeader}>
                  <TouchableOpacity onPress={() => navigate(-1)} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={20} color={colors.text_secondary} />
                  </TouchableOpacity>
                  <View style={styles.calHeaderCenter}>
                    <Text style={[styles.monthText, { color: colors.text_primary }]}>
                      {MONTHS_FULL[viewMonth]}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowYearPicker(true)}
                      style={styles.yearBtn}
                    >
                      <Text style={[styles.yearText, { color: colors.text_gold }]}>
                        {viewYear}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => navigate(1)} style={styles.navBtn}>
                    <Ionicons name="chevron-forward" size={20} color={colors.text_secondary} />
                  </TouchableOpacity>
                </View>

                {/* Day-of-week labels */}
                <View style={[styles.dayLabelsRow, { paddingHorizontal: spacing.sm }]}>
                  {DAYS_SHORT.map((d) => (
                    <Text
                      key={d}
                      style={[styles.dayLabel, { color: colors.text_muted, width: cellSize }]}
                    >
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Day grid */}
                <View style={[styles.dayGrid, { paddingHorizontal: spacing.sm }]}>
                  {cells.map((day, idx) => {
                    if (!day) {
                      return <View key={`e${idx}`} style={{ width: cellSize, height: cellSize }} />;
                    }
                    const isSelected =
                      parsed &&
                      parsed.year === viewYear &&
                      parsed.month === viewMonth &&
                      parsed.day === day;
                    const thisDate = new Date(viewYear, viewMonth, day);
                    const isFuture = thisDate > today;
                    const isToday = thisDate.toDateString() === today.toDateString();
                    return (
                      <TouchableOpacity
                        key={`d${day}`}
                        style={[
                          styles.dayCell,
                          { width: cellSize, height: cellSize },
                          isSelected && {
                            backgroundColor: colors.accent_rose,
                            borderRadius: cellSize / 2,
                          },
                          isToday &&
                            !isSelected && {
                              borderWidth: 1,
                              borderColor: colors.text_gold,
                              borderRadius: cellSize / 2,
                            },
                        ]}
                        onPress={() => !isFuture && selectDay(day)}
                        disabled={isFuture}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            {
                              color: isSelected
                                ? '#fff'
                                : isFuture
                                ? colors.text_muted
                                : isToday
                                ? colors.text_gold
                                : colors.text_primary,
                            },
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Today shortcut */}
                <TouchableOpacity
                  style={[styles.todayBtn, { borderTopColor: colors.glass_border }]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    const t = new Date();
                    onChange(toISO(t.getFullYear(), t.getMonth(), t.getDate()));
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.todayText, { color: colors.text_muted }]}>TODAY</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '500' as const,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  trigger: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  calIcon: {
    marginRight: spacing.sm,
  },
  triggerText: {
    fontSize: fontSizes.base,
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: spacing.xl,
  },
  calendar: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden' as const,
    maxHeight: 440,
  },
  calHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  navBtn: {
    padding: spacing.sm,
  },
  calHeaderCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  monthText: {
    fontSize: fontSizes.base,
    fontWeight: '600' as const,
  },
  yearBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  yearText: {
    fontSize: fontSizes.base,
    fontWeight: '600' as const,
  },
  dayLabelsRow: {
    flexDirection: 'row' as const,
    marginBottom: spacing.xs,
  },
  dayLabel: {
    textAlign: 'center' as const,
    fontSize: fontSizes.xs,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  dayGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: spacing.sm,
  },
  dayCell: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dayText: {
    fontSize: fontSizes.sm,
  },
  todayBtn: {
    borderTopWidth: 1,
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
  },
  todayText: {
    fontSize: fontSizes.xs,
    letterSpacing: 1.2,
    fontWeight: '500' as const,
  },
  yearPickerContainer: {
    maxHeight: 380,
  },
  yearPickerHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  yearPickerTitle: {
    fontSize: fontSizes.base,
    fontWeight: '600' as const,
  },
  yearOption: {
    height: YEAR_ITEM_HEIGHT,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  yearOptionText: {
    fontSize: fontSizes.base,
  },
});
