import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColors, ThemeShadows, fontSizes, spacing, radius } from '@/constants/theme';
import { useApp, SubscriptionPlan, IAPProduct } from '@/context/AppContext';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';
import GhostButton from './GhostButton';
import GoldBadge from './GoldBadge';
import GoldDivider from './GoldDivider';

type PaywallTab = 'plans' | 'addons' | 'bundles';

const SUB_PLANS: { id: SubscriptionPlan; name: string; price: string; period: string; monthlyEquiv?: string; badge?: string; icon: string; features: string[] }[] = [
  {
    id: 'generator_unlimited',
    name: 'Unlimited',
    price: '$3.99',
    period: '/mo',
    icon: 'flash-outline',
    features: [
      'Unlimited AI generations',
      'No watermark on exports',
      'All export card styles',
      'Priority generation speed',
    ],
  },
  {
    id: 'premium_plus',
    name: 'Plus',
    price: '$8.99',
    period: '/mo',
    badge: 'MOST POPULAR',
    icon: 'star-outline',
    features: [
      'Everything in Unlimited',
      'AI Relationship Coach',
      'All test reports unlocked',
      'All PDF reports included',
      'Premium card exports',
    ],
  },
  {
    id: 'premium_couples',
    name: 'Couples',
    price: '$14.99',
    period: '/mo',
    badge: 'BEST FOR PAIRS',
    icon: 'heart-outline',
    features: [
      'Everything in Plus',
      'Partner Mode access',
      'Joint daily prompts',
      'Weekly couple summary',
      'Shared prompt deck',
    ],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$79.99',
    period: ' once',
    badge: 'BEST VALUE',
    monthlyEquiv: 'Pay once, own forever',
    icon: 'diamond-outline',
    features: [
      'Everything in Couples',
      'Lifetime access forever',
      'All future features included',
      'No recurring charges',
      'Priority support',
    ],
  },
];

const ADDON_PRODUCTS: { id: IAPProduct; name: string; price: string; icon: string; desc: string }[] = [
  { id: 'credit_pack_5', name: '5 AI Credits', price: '$0.99', icon: 'sparkles-outline', desc: '5 additional AI generations' },
  { id: 'premium_card_single', name: 'Premium Card', price: '$0.50', icon: 'image-outline', desc: 'Export one creation as premium card' },
  { id: 'premium_card_all', name: 'All Export Styles', price: '$0.99', icon: 'images-outline', desc: 'Unlock all export card designs' },
  { id: 'test_love_personality', name: 'Love Personality', price: '$3.99', icon: 'ribbon-outline', desc: 'Full personality test report' },
  { id: 'report_zodiac', name: 'Zodiac Report', price: '$4.99', icon: 'planet-outline', desc: 'Full Zodiac Compatibility PDF' },
  { id: 'report_numerology', name: 'Numerology Report', price: '$4.99', icon: 'calculator-outline', desc: 'Numerology Love PDF report' },
  { id: 'report_soulmate', name: 'Soulmate Profile', price: '$4.99', icon: 'search-outline', desc: 'Detailed Soulmate Profile doc' },
  { id: 'report_attachment', name: 'Attachment Report', price: '$3.99', icon: 'link-outline', desc: 'Attachment Style full report' },
  { id: 'prompt_deck', name: 'Prompt Deck', price: '$4.99', icon: 'albums-outline', desc: '50 premium conversation prompts' },
];

const BUNDLE_PRODUCTS: { id: IAPProduct; name: string; price: string; origPrice: string; save: string; icon: string; includes: string[] }[] = [
  {
    id: 'bundle_starter',
    name: 'Starter Bundle',
    price: '$14.99',
    origPrice: '$9.98',
    save: 'SAVE 25%',
    icon: 'gift-outline',
    includes: ['Couples Prompt Deck', 'Soulmate Discovery Kit'],
  },
  {
    id: 'bundle_growth',
    name: 'Growth Bundle',
    price: '$29.99',
    origPrice: '$24.96',
    save: 'SAVE 40%',
    icon: 'trending-up-outline',
    includes: ['Everything in Starter', 'Zodiac Compatibility PDF', 'Numerology Life Report'],
  },
  {
    id: 'bundle_complete',
    name: 'Complete Bundle',
    price: '$49.99',
    origPrice: '$36.90',
    save: 'SAVE 55%',
    icon: 'trophy-outline',
    includes: ['Everything in Growth', 'Soulmate Profile', 'Attachment Style Report', 'Love Personality Test'],
  },
];

function createStyles(c: ThemeColors, s: ThemeShadows) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
    },
    scrollContent: {
      flexGrow: 1,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    content: {
      backgroundColor: c.bg_surface,
      borderRadius: radius.xl,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: c.glass_border,
    },
    topBar: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: spacing.lg,
      paddingBottom: spacing.sm,
    },
    closeBtn: {
      padding: spacing.xs,
    },
    headerSection: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
      alignItems: 'center' as const,
    },
    title: {
      fontSize: fontSizes['2xl'],
      color: c.text_primary,
      fontWeight: '700' as const,
      textAlign: 'center' as const,
      letterSpacing: -0.5,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: fontSizes.sm,
      color: c.text_secondary,
      textAlign: 'center' as const,
      marginBottom: spacing.md,
    },
    tabRow: {
      flexDirection: 'row' as const,
      marginHorizontal: spacing.lg,
      backgroundColor: c.glass_fill,
      borderRadius: radius.full,
      padding: 3,
      marginBottom: spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      alignItems: 'center' as const,
    },
    tabActive: {
      backgroundColor: c.bg_elevated,
      ...s.card,
    },
    tabText: {
      fontSize: fontSizes.sm,
      color: c.text_muted,
      fontWeight: '500' as const,
    },
    tabTextActive: {
      color: c.text_primary,
      fontWeight: '600' as const,
    },
    plansList: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.lg,
    },
    planCard: {
      padding: spacing.lg,
      position: 'relative' as const,
    },
    planCardSelected: {
      ...s.rose_glow,
    },
    planTopRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: spacing.sm,
    },
    planNameRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    planIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    planName: {
      fontSize: fontSizes.md,
      color: c.text_primary,
      fontWeight: '700' as const,
    },
    planPriceRow: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
    },
    planPrice: {
      fontSize: fontSizes.xl,
      color: c.text_gold,
      fontWeight: '700' as const,
    },
    planPeriod: {
      fontSize: fontSizes.sm,
      color: c.text_muted,
    },
    planMonthlyEquiv: {
      fontSize: fontSizes.xs,
      color: c.accent_gold,
      marginTop: 2,
      textAlign: 'right' as const,
    },
    planBadge: {
      position: 'absolute' as const,
      top: -8,
      right: spacing.lg,
    },
    planFeatures: {
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    planFeatureRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    planFeatureText: {
      fontSize: fontSizes.sm,
      color: c.text_secondary,
    },
    currentLabel: {
      alignSelf: 'flex-start' as const,
      marginTop: spacing.sm,
    },
    currentLabelText: {
      fontSize: fontSizes.xs,
      color: c.success,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    ctaSection: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    trialNote: {
      fontSize: fontSizes.xs,
      color: c.text_muted,
      textAlign: 'center' as const,
      marginTop: spacing.sm,
    },
    footerRow: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: spacing.md,
      paddingBottom: spacing.lg,
    },
    footerBtn: {
      borderWidth: 0,
      paddingHorizontal: spacing.md,
    },
    activeBanner: {
      marginHorizontal: spacing.lg,
      padding: spacing.lg,
      alignItems: 'center' as const,
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    activeBannerPlan: {
      fontSize: fontSizes.lg,
      color: c.text_gold,
      fontWeight: '700' as const,
    },
    activeBannerPrice: {
      fontSize: fontSizes.sm,
      color: c.text_secondary,
    },
    addonGrid: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      paddingBottom: spacing.lg,
    },
    addonCard: {
      padding: spacing.md,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    addonIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: c.glass_fill,
      borderWidth: 1,
      borderColor: c.glass_border,
    },
    addonInfo: {
      flex: 1,
    },
    addonName: {
      fontSize: fontSizes.base,
      color: c.text_primary,
      fontWeight: '600' as const,
    },
    addonDesc: {
      fontSize: fontSizes.xs,
      color: c.text_muted,
      marginTop: 1,
    },
    addonPriceBtn: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: c.accent_rose,
      backgroundColor: 'rgba(255,61,127,0.08)',
    },
    addonPriceBtnOwned: {
      borderColor: c.success,
      backgroundColor: 'rgba(78,205,196,0.08)',
    },
    addonPriceText: {
      fontSize: fontSizes.sm,
      color: c.accent_rose,
      fontWeight: '600' as const,
    },
    addonPriceTextOwned: {
      color: c.success,
    },
    bundleCard: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    bundleTopRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    bundleNameRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    bundleName: {
      fontSize: fontSizes.md,
      color: c.text_primary,
      fontWeight: '700' as const,
    },
    bundlePriceCol: {
      alignItems: 'flex-end' as const,
    },
    bundlePrice: {
      fontSize: fontSizes.lg,
      color: c.text_gold,
      fontWeight: '700' as const,
    },
    bundleOrigPrice: {
      fontSize: fontSizes.xs,
      color: c.text_muted,
      textDecorationLine: 'line-through' as const,
    },
    bundleIncludes: {
      gap: spacing.xs,
    },
    bundleIncludeRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    bundleIncludeText: {
      fontSize: fontSizes.sm,
      color: c.text_secondary,
    },
    sectionLabel: {
      fontSize: fontSizes.xs,
      color: c.text_muted,
      fontWeight: '600' as const,
      letterSpacing: 1.2,
      textTransform: 'uppercase' as const,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
  });
}

export default function PaywallModal() {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const {
    showPaywall, closePaywall, upgradePlan, purchaseIAP,
    subscription, purchasedIAPs, PLAN_DETAILS,
  } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('premium_plus');
  const [activeTab, setActiveTab] = useState<PaywallTab>('plans');

  const handlePurchasePlan = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const plan = SUB_PLANS.find(p => p.id === selectedPlan);
    upgradePlan(selectedPlan);
    Alert.alert(
      'Upgrade Successful',
      `You are now on the ${plan?.name || 'Premium'} plan (${plan?.price}${plan?.period}). All features are now unlocked!`,
      [{ text: 'Awesome!', onPress: closePaywall }]
    );
  }, [selectedPlan, upgradePlan, closePaywall]);

  const handlePurchaseAddon = useCallback((productId: IAPProduct, productName: string, price: string) => {
    if (purchasedIAPs.includes(productId)) {
      Alert.alert('Already Owned', `You already own ${productName}.`);
      return;
    }
    Alert.alert(
      'Confirm Purchase',
      `Purchase ${productName} for ${price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            purchaseIAP(productId);
            Alert.alert('Purchased!', `${productName} has been unlocked.`);
          },
        },
      ]
    );
  }, [purchaseIAP, purchasedIAPs]);

  const handleRestore = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (subscription !== 'free') {
      Alert.alert('Restored', `Your ${PLAN_DETAILS[subscription].label} plan has been restored.`);
      closePaywall();
    } else {
      Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
    }
  }, [subscription, PLAN_DETAILS, closePaywall]);

  const handleDowngrade = useCallback(() => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to downgrade to the free plan?',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Downgrade',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            upgradePlan('free');
            Alert.alert('Downgraded', 'You are now on the free plan.');
            closePaywall();
          },
        },
      ]
    );
  }, [upgradePlan, closePaywall]);

  const renderPlansTab = () => (
    <>
      {subscription !== 'free' && (
        <GlassCard style={styles.activeBanner}>
          <GoldBadge label="CURRENT PLAN" />
          <Text style={styles.activeBannerPlan}>{PLAN_DETAILS[subscription].label}</Text>
          <Text style={styles.activeBannerPrice}>{PLAN_DETAILS[subscription].price}</Text>
          <GhostButton label="Cancel Subscription" onPress={handleDowngrade} style={styles.footerBtn} />
        </GlassCard>
      )}

      <Text style={styles.sectionLabel}>Choose Your Plan</Text>
      <View style={styles.plansList}>
        {SUB_PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isCurrent = subscription === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              onPress={() => { setSelectedPlan(plan.id); Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <GlassCard
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                gradient={isSelected}
              >
                {plan.badge && <GoldBadge label={plan.badge} style={styles.planBadge} />}
                <View style={styles.planTopRow}>
                  <View style={styles.planNameRow}>
                    <LinearGradient
                      colors={[colors.grad_rose_start, colors.grad_violet_end]}
                      style={styles.planIconCircle}
                    >
                      <Ionicons name={plan.icon as any} size={18} color={colors.text_on_grad} />
                    </LinearGradient>
                    <Text style={styles.planName}>{plan.name}</Text>
                  </View>
                  <View>
                    <View style={styles.planPriceRow}>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>
                    {plan.monthlyEquiv && (
                      <Text style={styles.planMonthlyEquiv}>{plan.monthlyEquiv}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.planFeatures}>
                  {plan.features.map((feat, fi) => (
                    <View key={fi} style={styles.planFeatureRow}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={styles.planFeatureText}>{feat}</Text>
                    </View>
                  ))}
                </View>
                {isCurrent && (
                  <View style={styles.currentLabel}>
                    <Text style={styles.currentLabelText}>Current Plan</Text>
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.ctaSection}>
        <GradientButton
          label={subscription === selectedPlan ? 'Current Plan' : selectedPlan === 'lifetime' ? 'Get Lifetime Access · $79.99' : `Upgrade to ${SUB_PLANS.find(p => p.id === selectedPlan)?.name} · ${SUB_PLANS.find(p => p.id === selectedPlan)?.price}${SUB_PLANS.find(p => p.id === selectedPlan)?.period}`}
          onPress={handlePurchasePlan}
          disabled={subscription === selectedPlan}
        />
        <Text style={styles.trialNote}>
          {selectedPlan === 'lifetime' ? 'One-time payment. No subscription.' : 'Test Store — Instant activation. Cancel anytime.'}
        </Text>
      </View>
    </>
  );

  const renderAddonsTab = () => (
    <>
      <Text style={styles.sectionLabel}>Individual Purchases</Text>
      <View style={styles.addonGrid}>
        {ADDON_PRODUCTS.map((product) => {
          const owned = purchasedIAPs.includes(product.id);
          return (
            <GlassCard key={product.id} style={styles.addonCard}>
              <View style={styles.addonIconCircle}>
                <Ionicons name={product.icon as any} size={20} color={owned ? colors.success : colors.accent_violet} />
              </View>
              <View style={styles.addonInfo}>
                <Text style={styles.addonName}>{product.name}</Text>
                <Text style={styles.addonDesc}>{product.desc}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handlePurchaseAddon(product.id, product.name, product.price)}
                style={[styles.addonPriceBtn, owned && styles.addonPriceBtnOwned]}
                activeOpacity={0.7}
              >
                <Text style={[styles.addonPriceText, owned && styles.addonPriceTextOwned]}>
                  {owned ? 'Owned' : product.price}
                </Text>
              </TouchableOpacity>
            </GlassCard>
          );
        })}
      </View>
    </>
  );

  const renderBundlesTab = () => (
    <>
      <Text style={styles.sectionLabel}>Save with Bundles</Text>
      <View style={styles.plansList}>
        {BUNDLE_PRODUCTS.map((bundle) => {
          const owned = purchasedIAPs.includes(bundle.id);
          return (
            <GlassCard key={bundle.id} style={styles.bundleCard}>
              <View style={styles.bundleTopRow}>
                <View style={styles.bundleNameRow}>
                  <LinearGradient
                    colors={[colors.grad_gold_start, colors.grad_gold_end]}
                    style={styles.planIconCircle}
                  >
                    <Ionicons name={bundle.icon as any} size={18} color="#1a1a1a" />
                  </LinearGradient>
                  <View>
                    <Text style={styles.bundleName}>{bundle.name}</Text>
                    <GoldBadge label={bundle.save} />
                  </View>
                </View>
                <View style={styles.bundlePriceCol}>
                  <Text style={styles.bundlePrice}>{bundle.price}</Text>
                </View>
              </View>
              <GoldDivider />
              <View style={styles.bundleIncludes}>
                {bundle.includes.map((item, idx) => (
                  <View key={idx} style={styles.bundleIncludeRow}>
                    <Ionicons name="gift-outline" size={14} color={colors.accent_gold} />
                    <Text style={styles.bundleIncludeText}>{item}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => handlePurchaseAddon(bundle.id, bundle.name, bundle.price)}
                style={[styles.addonPriceBtn, { alignSelf: 'center' as const, marginTop: spacing.sm }, owned && styles.addonPriceBtnOwned]}
                activeOpacity={0.7}
              >
                <Text style={[styles.addonPriceText, owned && styles.addonPriceTextOwned]}>
                  {owned ? 'Owned' : `Buy for ${bundle.price}`}
                </Text>
              </TouchableOpacity>
            </GlassCard>
          );
        })}
      </View>
    </>
  );

  const TABS: { id: PaywallTab; label: string }[] = [
    { id: 'plans', label: 'Plans' },
    { id: 'addons', label: 'Add-ons' },
    { id: 'bundles', label: 'Bundles' },
  ];

  return (
    <Modal visible={showPaywall} transparent animationType="fade" onRequestClose={closePaywall}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.topBar}>
              <GoldBadge label="TEST STORE" />
              <TouchableOpacity onPress={closePaywall} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text_secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.headerSection}>
              <Text style={styles.title}>Unlock LoveTestAI</Text>
              <Text style={styles.subtitle}>Choose a plan or individual features</Text>
            </View>

            <View style={styles.tabRow}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => { setActiveTab(tab.id); Haptics.selectionAsync(); }}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                >
                  <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'plans' && renderPlansTab()}
            {activeTab === 'addons' && renderAddonsTab()}
            {activeTab === 'bundles' && renderBundlesTab()}

            <View style={styles.footerRow}>
              <GhostButton label="Restore Purchases" onPress={handleRestore} style={styles.footerBtn} />
              <GhostButton label="Start Free" onPress={closePaywall} style={styles.footerBtn} />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
