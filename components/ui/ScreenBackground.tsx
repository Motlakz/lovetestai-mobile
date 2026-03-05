import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ScreenBackgroundProps {
  children: React.ReactNode;
}

export default function ScreenBackground({ children }: ScreenBackgroundProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg_deep }]}>
      <View style={[styles.blobTopLeft, { backgroundColor: colors.accent_rose }]} />
      <View style={[styles.blobBottomRight, { backgroundColor: colors.accent_violet }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blobTopLeft: {
    position: 'absolute' as const,
    top: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.08,
  },
  blobBottomRight: {
    position: 'absolute' as const,
    bottom: -60,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.06,
  },
});
