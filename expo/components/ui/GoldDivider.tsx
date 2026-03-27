import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/constants/theme';

interface GoldDividerProps {
  style?: ViewStyle;
}

export default function GoldDivider({ style }: GoldDividerProps) {
  const { colors } = useTheme();

  return <View style={[styles.divider, { backgroundColor: colors.accent_gold }, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    opacity: 0.20,
    width: '100%',
    marginVertical: spacing.lg,
  },
});
