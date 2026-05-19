import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/ui/GlassCard';
import { fontSizes, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { getPromoById, usePromoStore } from '@/store/promoStore';

export default function InAppPromoModal() {
  const { colors } = useTheme();
  const activePromo = usePromoStore((s) => s.activePromo);
  const dismissPromo = usePromoStore((s) => s.dismissPromo);
  const openActivePromo = usePromoStore((s) => s.openActivePromo);
  const promo = useMemo(() => activePromo ? getPromoById(activePromo.promoId) : undefined, [activePromo]);

  return (
    <Modal visible={!!activePromo && !!promo} transparent animationType="fade" onRequestClose={dismissPromo}>
      <Pressable style={styles.backdrop} onPress={dismissPromo}>
        <Pressable style={styles.sheetWrap} onPress={(e) => e.stopPropagation()}>
          {promo && (
            <GlassCard style={[styles.card, { borderColor: `${promo.accent}66` }]}>
              <TouchableOpacity style={styles.close} onPress={dismissPromo} hitSlop={10} accessibilityLabel="Dismiss promo">
                <Ionicons name="close" size={20} color={colors.text_muted} />
              </TouchableOpacity>
              <View style={[styles.iconWrap, { backgroundColor: `${promo.accent}18`, borderColor: `${promo.accent}55` }]}>
                <Ionicons name={promo.iconName as any} size={30} color={promo.accent} />
              </View>
              <Text style={[styles.eyebrow, { color: promo.accent }]}>{promo.eyebrow}</Text>
              <Text style={[styles.title, { color: colors.text_primary }]}>{promo.title}</Text>
              <Text style={[styles.body, { color: colors.text_secondary }]}>{promo.body}</Text>
              <TouchableOpacity
                style={[styles.cta, { backgroundColor: promo.accent }]}
                activeOpacity={0.85}
                onPress={() => void openActivePromo()}
              >
                <Ionicons name="open-outline" size={18} color="#fff" />
                <Text style={styles.ctaText}>{promo.cta}</Text>
              </TouchableOpacity>
            </GlassCard>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheetWrap: {
    maxWidth: 420,
    width: '100%',
  },
  card: {
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  close: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    zIndex: 2,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 64,
  },
  eyebrow: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    fontSize: fontSizes.sm,
    lineHeight: 21,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cta: {
    alignItems: 'center',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 46,
    paddingHorizontal: spacing.xl,
  },
  ctaText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '800',
  },
});
