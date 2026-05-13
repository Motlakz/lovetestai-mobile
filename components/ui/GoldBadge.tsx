import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { radius, fontSizes, spacing } from '@/constants/theme';

interface GoldBadgeProps {
  label: string;
  style?: ViewStyle;
}

export default function GoldBadge({ label, style }: GoldBadgeProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: `${colors.accent_gold}22`, borderColor: `${colors.accent_gold}4D` }, style]}>
      <Text style={[styles.label, { color: colors.text_gold }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start' as const,
  },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
});
