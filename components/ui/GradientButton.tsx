import React, { useRef, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { radius, fontSizes, spacing } from '@/constants/theme';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  small?: boolean;
  icon?: React.ReactNode;
  noTopMargin?: boolean;
}

export default function GradientButton({ label, onPress, style, disabled, small, icon, noTopMargin }: GradientButtonProps) {
  const { colors, shadows } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
        testID="gradient-button"
      >
        <LinearGradient
          colors={[colors.grad_rose_start, colors.grad_violet_end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            shadows.rose_glow,
            small && styles.gradientSmall,
            noTopMargin && styles.noTopMargin,
            disabled && styles.disabled,
          ]}
        >
          {icon && icon}
          <Text style={[styles.label, small && styles.labelSmall, { color: colors.text_on_grad }]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    borderRadius: radius.full,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  gradientSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  noTopMargin: {
    marginTop: 0,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: fontSizes.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});
