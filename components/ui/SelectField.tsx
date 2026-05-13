import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { radius, fontSizes, spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export default function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select…',
}: SelectFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

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
        <Text style={[styles.triggerText, { color: value ? colors.text_primary : colors.text_muted }]}>
          {value || placeholder}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.text_muted}
        />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: colors.overlay_dark }]}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: colors.bg_elevated, borderColor: colors.glass_border },
            ]}
          >
            <Text
              style={[
                styles.sheetTitle,
                { color: colors.text_secondary, borderBottomColor: colors.glass_border },
              ]}
            >
              {label}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {options.map((opt) => {
                const isSelected = opt === value;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.option,
                      isSelected && { backgroundColor: 'rgba(255,61,127,0.10)' },
                    ]}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      onChange(opt);
                      setOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? colors.accent_rose : colors.text_primary },
                      ]}
                    >
                      {opt}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color={colors.accent_rose} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
    justifyContent: 'space-between' as const,
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
  sheet: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden' as const,
    maxHeight: 380,
  },
  sheetTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  option: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionText: {
    fontSize: fontSizes.base,
    flex: 1,
  },
});
