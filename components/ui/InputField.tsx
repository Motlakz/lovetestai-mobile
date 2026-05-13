import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { radius, fontSizes, spacing } from '@/constants/theme';

interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  style?: ViewStyle;
  maxLength?: number;
}

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  style,
  maxLength,
}: InputFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.text_secondary }]}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text_muted}
        multiline={multiline}
        maxLength={maxLength}
        style={[
          styles.input,
          {
            backgroundColor: colors.glass_fill,
            borderColor: colors.glass_border,
            color: colors.text_primary,
          },
          multiline && styles.multiline,
        ]}
        testID="input-field"
      />
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
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSizes.base,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
});
