import React from 'react';
import { Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { fontSizes, spacing } from '@/constants/theme';

interface SectionTitleProps {
  title: string;
  style?: StyleProp<TextStyle>;
}

export default function SectionTitle({ title, style }: SectionTitleProps) {
  const { colors } = useTheme();

  return <Text style={[styles.title, { color: colors.accent_gold }, style]}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '600' as const,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
});
