import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { radius, fontSizes, spacing } from '@/constants/theme';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';
import GhostButton from './GhostButton';

interface LockedOverlayProps {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onUpgrade: () => void;
  onRestore?: () => void;
  compact?: boolean;
}

export default function LockedOverlay({
  title,
  subtitle,
  ctaLabel = 'Upgrade to Unlock',
  onUpgrade,
  onRestore,
  compact,
}: LockedOverlayProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.overlay, { backgroundColor: colors.overlay_dark }]}>
      <View style={styles.inner}>
        <GlassCard style={[styles.card, compact && styles.cardCompact]}>
          <Ionicons name="lock-closed-outline" size={compact ? 22 : 28} color={colors.accent_violet} />
          <Text style={[styles.title, { color: colors.text_primary }, compact && styles.titleCompact]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.text_secondary }, compact && styles.subtitleCompact]}>{subtitle}</Text>
          <GradientButton label={ctaLabel} onPress={onUpgrade} style={styles.cta} small />
          {onRestore && (
            <GhostButton label="Restore Purchases" onPress={onRestore} style={styles.restore} />
          )}
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.xl,
    zIndex: 10,
    overflow: 'hidden' as const,
  },
  inner: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  card: {
    padding: spacing.lg,
    alignItems: 'center' as const,
    gap: spacing.sm,
    maxWidth: '100%',
  },
  cardCompact: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  titleCompact: {
    fontSize: fontSizes.sm,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    textAlign: 'center' as const,
  },
  subtitleCompact: {
    fontSize: fontSizes.xs,
  },
  cta: {
    marginTop: spacing.xs,
  },
  restore: {
    borderWidth: 0,
    paddingVertical: spacing.xs,
  },
});
