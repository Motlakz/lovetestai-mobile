import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { radius, fontSizes, spacing } from '@/constants/theme';

interface GhostButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export default function GhostButton({ label, onPress, style, icon }: GhostButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.button, { borderColor: colors.glass_border }, style]}
      testID="ghost-button"
    >
      {icon && icon}
      <Text style={[styles.label, { color: colors.text_secondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: '400' as const,
  },
});
