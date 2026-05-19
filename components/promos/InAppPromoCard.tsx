import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/ui/GlassCard';
import { fontSizes, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { AppPromo, getPromoById, usePromoStore } from '@/store/promoStore';

interface InAppPromoCardProps {
  promoId?: AppPromo['id'];
  placement?: string;
  style?: StyleProp<ViewStyle>;
}

export default function InAppPromoCard({ promoId, placement = 'inline', style }: InAppPromoCardProps) {
  const { colors } = useTheme();
  const activePromo = usePromoStore((s) => s.activePromo);
  const dismissPromo = usePromoStore((s) => s.dismissPromo);
  const openActivePromo = usePromoStore((s) => s.openActivePromo);
  const openPromo = usePromoStore((s) => s.openPromo);
  const promo = useMemo(() => getPromoById(promoId ?? activePromo?.promoId ?? 'speakdiary'), [activePromo?.promoId, promoId]);
  const isCadencePromo = !promoId && !!activePromo;

  if (!promo || (!promoId && !activePromo)) return null;

  const handleOpen = () => {
    if (isCadencePromo) {
      void openActivePromo();
    } else {
      void openPromo(promo.id, placement);
    }
  };

  return (
    <GlassCard style={[styles.card, { borderColor: `${promo.accent}55` }, style]}>
      <View style={[styles.iconWrap, { backgroundColor: `${promo.accent}18`, borderColor: `${promo.accent}55` }]}>
        <Ionicons name={promo.iconName as any} size={22} color={promo.accent} />
      </View>
      <TouchableOpacity style={styles.copy} activeOpacity={0.8} onPress={handleOpen}>
        <Text style={[styles.eyebrow, { color: promo.accent }]}>{promo.inlineEyebrow ?? promo.eyebrow}</Text>
        <Text style={[styles.title, { color: colors.text_primary }]} numberOfLines={1}>{promo.title}</Text>
        <Text style={[styles.body, { color: colors.text_secondary }]} numberOfLines={2}>{promo.body}</Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: promo.accent }]}
          onPress={handleOpen}
          activeOpacity={0.85}
        >
          <Ionicons name="open-outline" size={15} color="#fff" />
          <Text style={styles.ctaText}>Open</Text>
        </TouchableOpacity>
        {isCadencePromo && (
          <TouchableOpacity style={styles.close} onPress={dismissPromo} hitSlop={8} accessibilityLabel="Dismiss promo">
            <Ionicons name="close" size={18} color={colors.text_muted} />
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: '800',
    marginTop: 2,
  },
  body: {
    fontSize: fontSizes.xs,
    lineHeight: 17,
    marginTop: 3,
  },
  actions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  cta: {
    alignItems: 'center',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: 4,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  ctaText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },
  close: {
    padding: 2,
  },
});
