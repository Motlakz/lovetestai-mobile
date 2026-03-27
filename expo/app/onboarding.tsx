import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColors, ThemeShadows, fontSizes, spacing, radius } from '@/constants/theme';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import GhostButton from '@/components/ui/GhostButton';
import GoldBadge from '@/components/ui/GoldBadge';
import HeartParticles from '@/components/ui/HeartParticles';
import ScreenBackground from '@/components/ui/ScreenBackground';
import { useApp } from '@/context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INTENTS = [
  { id: 'express', icon: 'heart-outline' as const, label: 'Express My Love', sub: 'Write letters, poems & notes' },
  { id: 'discover', icon: 'analytics-outline' as const, label: 'Discover Compatibility', sub: 'Tests, zodiac & love language' },
  { id: 'advice', icon: 'chatbubble-ellipses-outline' as const, label: 'Get Relationship Advice', sub: 'AI coach for communication' },
  { id: 'all', icon: 'infinite-outline' as const, label: 'All of the Above', sub: 'The full LoveTestAI experience' },
];

const STATUSES = ['Single', 'In a Relationship', "It's Complicated", 'Prefer not to say'];

const PAYWALL_FEATURES = [
  { icon: 'infinite-outline' as const, label: 'Unlimited AI love letters, poems & notes' },
  { icon: 'chatbubble-ellipses-outline' as const, label: 'AI Relationship Coach, unlimited sessions' },
  { icon: 'documents-outline' as const, label: 'All compatibility & personality reports' },
  { icon: 'people-outline' as const, label: 'Partner Mode with shared daily prompts' },
  { icon: 'download-outline' as const, label: 'Premium card exports, no watermark' },
];

function createStyles(c: ThemeColors, s: ThemeShadows) {
  return StyleSheet.create({
    container: { flex: 1 },
    slideWrapper: { flex: 1 },
    slideContainer: { flex: 1, paddingHorizontal: spacing.xl },
    slideContent: { flex: 1, justifyContent: 'center' as const },
    logoContainer: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: c.accent_gold, alignItems: 'center' as const, justifyContent: 'center' as const, alignSelf: 'center' as const, marginBottom: spacing.xl, backgroundColor: `${c.accent_gold}14` },
    logoMark: { fontSize: fontSizes.display, color: c.accent_gold, fontWeight: '700' as const, letterSpacing: -2 },
    appName: { fontSize: fontSizes.display, color: c.text_primary, fontWeight: '700' as const, textAlign: 'center' as const, letterSpacing: -0.5, marginBottom: spacing.sm },
    tagline: { fontSize: fontSizes.md, color: c.text_secondary, textAlign: 'center' as const, fontStyle: 'italic' as const, marginBottom: spacing.lg },
    descriptors: { fontSize: fontSizes.sm, color: c.text_muted, textAlign: 'center' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: spacing['3xl'] },
    ctaGroup: { gap: spacing.md, alignItems: 'center' as const },
    slideTitle: { fontSize: fontSizes['2xl'], color: c.text_primary, fontWeight: '600' as const, textAlign: 'center' as const, marginBottom: spacing.sm },
    slideSubtitle: { fontSize: fontSizes.sm, color: c.text_secondary, textAlign: 'center' as const, marginBottom: spacing['2xl'] },
    intentGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.md, marginBottom: spacing['2xl'] },
    intentCard: { width: (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2, padding: spacing.lg, alignItems: 'center' as const, gap: spacing.sm },
    intentCardSelected: { ...s.rose_glow },
    intentLabel: { fontSize: fontSizes.base, color: c.text_primary, fontWeight: '500' as const, textAlign: 'center' as const },
    intentSub: { fontSize: fontSizes.xs, color: c.text_muted, textAlign: 'center' as const },
    bottomCta: { alignSelf: 'center' as const },
    fieldGroup: { marginBottom: spacing.xl },
    fieldLabel: { fontSize: fontSizes.sm, color: c.text_secondary, fontWeight: '500' as const, marginBottom: spacing.sm },
    textInput: { backgroundColor: c.glass_fill, borderWidth: 1, borderColor: c.glass_border, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, color: c.text_primary, fontSize: fontSizes.base },
    profileScroll: { flex: 1 },
    profileScrollContent: { flexGrow: 1, justifyContent: 'center' as const, paddingVertical: spacing.xl, paddingHorizontal: spacing.xs },
    paywallScrollContent: { flexGrow: 1, justifyContent: 'center' as const, paddingVertical: spacing.lg },
    pillRow: { flexDirection: 'row' as const, marginBottom: spacing.md },
    pill: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.full, borderWidth: 1, borderColor: c.glass_border, marginRight: spacing.sm, backgroundColor: c.glass_fill },
    pillSelected: { borderColor: c.accent_rose, backgroundColor: 'rgba(255,61,127,0.12)' },
    pillText: { color: c.text_secondary, fontSize: fontSizes.sm },
    pillTextSelected: { color: c.text_primary, fontWeight: '500' as const },
    partnerNote: { padding: spacing.md, marginTop: spacing.sm },
    partnerNoteText: { color: c.text_secondary, fontSize: fontSizes.sm },
    ctaRow: { flexDirection: 'row' as const, gap: spacing.md, marginTop: spacing.lg },
    skipBtn: { alignSelf: 'center' as const, marginTop: spacing.md, borderWidth: 0 },
    notifPreview: { padding: spacing.xl, marginBottom: spacing['2xl'], gap: spacing.sm },
    notifTitle: { color: c.text_primary, fontSize: fontSizes.md, fontWeight: '600' as const },
    notifBody: { color: c.text_secondary, fontSize: fontSizes.sm },
    notifTime: { color: c.text_muted, fontSize: fontSizes.xs, textTransform: 'uppercase' as const, letterSpacing: 1 },
    paywallHeader: { flexDirection: 'row' as const, justifyContent: 'flex-start' as const, marginBottom: spacing.lg },
    closeBtn: { padding: spacing.sm },
    offerBadge: { alignSelf: 'center' as const, marginBottom: spacing.lg },
    paywallTitle: { fontSize: fontSizes['2xl'], color: c.text_primary, fontWeight: '700' as const, textAlign: 'center' as const, letterSpacing: -0.5, marginBottom: spacing.sm },
    paywallSub: { fontSize: fontSizes.base, color: c.text_secondary, textAlign: 'center' as const, marginBottom: spacing.xl },
    featureList: { gap: spacing.md, marginBottom: spacing.xl },
    featureRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md },
    featureLabel: { color: c.text_secondary, fontSize: fontSizes.base, flex: 1 },
    planRow: { flexDirection: 'row' as const, gap: spacing.md, marginBottom: spacing.xl },
    planCard: { flex: 1, backgroundColor: c.glass_fill, borderWidth: 1, borderColor: c.glass_border, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' as const, gap: spacing.xs },
    planCardSelected: { borderColor: c.accent_rose, ...s.rose_glow },
    planName: { color: c.text_primary, fontSize: fontSizes.base, fontWeight: '600' as const },
    planPrice: { color: c.text_gold, fontSize: fontSizes.lg, fontWeight: '700' as const },
    planLabel: { color: c.text_muted, fontSize: fontSizes.xs, textTransform: 'uppercase' as const, letterSpacing: 1 },
    saveBadge: { position: 'absolute' as const, top: -8, right: -4 },
    trialNote: { color: c.text_muted, fontSize: fontSizes.xs, textAlign: 'center' as const, marginTop: spacing.md },
    paywallFooter: { flexDirection: 'row' as const, justifyContent: 'center' as const, gap: spacing.lg, marginTop: spacing.lg },
    footerBtn: { borderWidth: 0, paddingHorizontal: spacing.md },
    dots: { flexDirection: 'row' as const, justifyContent: 'center' as const, gap: spacing.sm, paddingVertical: spacing.lg },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.glass_border },
    dotActive: { backgroundColor: c.accent_rose, width: 24 },
  });
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { completeOnboarding, updateProfile, profile, upgradePlan } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [intent, setIntent] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [dob, setDob] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('plus');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goToSlide = useCallback((index: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setCurrentSlide(index);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const handleNext = useCallback(() => {
    if (currentSlide < 4) goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const handleComplete = useCallback(() => {
    updateProfile({ ...profile, name, relationshipStatus: status, dateOfBirth: dob, intent });
    completeOnboarding();
    router.replace('/(tabs)/(create)');
  }, [name, status, dob, intent, profile, updateProfile, completeOnboarding, router]);

  const handleNotifications = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        const { default: Notifications } = await import('expo-notifications');
        await Notifications.requestPermissionsAsync();
      } catch (e) {
        console.log('Notification permission error:', e);
      }
    }
    handleNext();
  }, [handleNext]);

  const renderWelcome = () => (
    <View style={styles.slideContainer}>
      <HeartParticles />
      <View style={styles.slideContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoMark}>LT</Text>
        </View>
        <Text style={styles.appName}>LoveTestAI</Text>
        <Text style={styles.tagline}>Romantic expression, powered by AI</Text>
        <Text style={styles.descriptors}>LOVE LETTERS  ·  COMPATIBILITY  ·  AI COACH</Text>
        <View style={styles.ctaGroup}>
          <GradientButton label="Get Started" onPress={handleNext} />
          <GhostButton label="I already have an account" onPress={handleNext} />
        </View>
      </View>
    </View>
  );

  const renderIntent = () => (
    <View style={styles.slideContainer}>
      <View style={styles.slideContent}>
        <Text style={styles.slideTitle}>What brings you here?</Text>
        <Text style={styles.slideSubtitle}>We will personalise your experience</Text>
        <View style={styles.intentGrid}>
          {INTENTS.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => setIntent(item.id)} activeOpacity={0.8}>
              <GlassCard style={[styles.intentCard, intent === item.id && styles.intentCardSelected]} gradient={intent === item.id}>
                <Ionicons name={item.icon} size={32} color={intent === item.id ? colors.accent_rose : colors.accent_violet} />
                <Text style={styles.intentLabel}>{item.label}</Text>
                <Text style={styles.intentSub}>{item.sub}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
        <GradientButton label="Continue" onPress={handleNext} disabled={!intent} style={styles.bottomCta} />
      </View>
    </View>
  );

  const renderProfileSetup = () => (
    <KeyboardAvoidingView style={styles.slideContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.profileScroll} contentContainerStyle={styles.profileScrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.slideTitle}>A little about you</Text>
        <Text style={styles.slideSubtitle}>Optional - you can update this anytime</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Your name</Text>
          <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="Your first name" placeholderTextColor={colors.text_muted} autoCapitalize="words" />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Date of birth</Text>
          <TextInput style={styles.textInput} value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" placeholderTextColor={colors.text_muted} keyboardType="numbers-and-punctuation" maxLength={10} />
          <Text style={[styles.fieldLabel, { fontSize: fontSizes.xs, color: colors.text_muted, marginTop: spacing.xs, marginBottom: 0 }]}>Used only for compatibility calculations</Text>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Relationship status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
            {STATUSES.map((s) => (
              <TouchableOpacity key={s} onPress={() => setStatus(s)} style={[styles.pill, status === s && styles.pillSelected]}>
                <Text style={[styles.pillText, status === s && styles.pillTextSelected]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {status === 'In a Relationship' && (
            <GlassCard style={styles.partnerNote}>
              <Text style={styles.partnerNoteText}>You can connect a partner later from your profile</Text>
            </GlassCard>
          )}
        </View>
        <View style={styles.ctaRow}>
          <GradientButton label="Continue" onPress={handleNext} style={{ flex: 1 }} />
        </View>
        <GhostButton label="Skip for now" onPress={handleNext} style={styles.skipBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderNotifPermission = () => (
    <View style={styles.slideContainer}>
      <View style={styles.slideContent}>
        <Text style={styles.slideTitle}>Stay inspired daily</Text>
        <Text style={styles.slideSubtitle}>Get a fresh prompt every morning to keep your relationship strong</Text>
        <GlassCard style={styles.notifPreview}>
          <Text style={styles.notifTitle}>Today{"'"}s prompt is ready</Text>
          <Text style={styles.notifBody}>What is one thing your partner did recently that you are grateful for?</Text>
          <Text style={styles.notifTime}>Daily · 9:00 AM</Text>
        </GlassCard>
        <View style={styles.ctaGroup}>
          <GradientButton label="Allow Notifications" onPress={handleNotifications} />
          <GhostButton label="Not now" onPress={handleNext} />
        </View>
      </View>
    </View>
  );

  const ONBOARDING_PLANS: { id: string; plan: 'generator_unlimited' | 'premium_plus' | 'premium_couples' | 'lifetime'; name: string; price: string; sub: string; badge?: string }[] = [
    { id: 'unlimited', plan: 'generator_unlimited', name: 'Unlimited', price: '$3.99/mo', sub: 'Unlimited AI generations' },
    { id: 'plus', plan: 'premium_plus', name: 'Plus', price: '$8.99/mo', sub: 'Coach + Reports + Exports', badge: 'POPULAR' },
    { id: 'couples', plan: 'premium_couples', name: 'Couples', price: '$14.99/mo', sub: 'Partner Mode + Everything' },
    { id: 'lifetime', plan: 'lifetime', name: 'Lifetime', price: '$79.99', sub: 'Pay once, own forever', badge: 'BEST VALUE' },
  ];

  const renderPaywall = () => (
    <View style={styles.slideContainer}>
      <ScrollView style={styles.profileScroll} contentContainerStyle={styles.paywallScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.paywallHeader}>
          <TouchableOpacity onPress={handleComplete} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text_secondary} />
          </TouchableOpacity>
        </View>
        <GoldBadge label="LIMITED OFFER" style={styles.offerBadge} />
        <Text style={styles.paywallTitle}>Unlock the Full Experience</Text>
        <Text style={styles.paywallSub}>Everything you need to express, discover, and connect</Text>
        <View style={styles.featureList}>
          {PAYWALL_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name={f.icon} size={20} color={colors.accent_gold} />
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>
        <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
          {ONBOARDING_PLANS.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => setSelectedPlan(p.id)} activeOpacity={0.8}>
              <View style={[styles.planCard, selectedPlan === p.id && styles.planCardSelected, { width: '100%', flexDirection: 'row' as const, justifyContent: 'space-between' as const }]}>
                {p.badge && <GoldBadge label={p.badge} style={styles.saveBadge} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{p.name}</Text>
                  <Text style={[styles.planLabel, { marginTop: 2 }]}>{p.sub}</Text>
                </View>
                <Text style={styles.planPrice}>{p.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <GradientButton label={selectedPlan === 'lifetime' ? 'Get Lifetime Access · $79.99' : 'Start Free Trial · 3 Days Free'} onPress={() => {
              updateProfile({ ...profile, name, relationshipStatus: status, dateOfBirth: dob, intent });
              const planMap: Record<string, 'generator_unlimited' | 'premium_plus' | 'premium_couples' | 'lifetime'> = {
                unlimited: 'generator_unlimited', plus: 'premium_plus', couples: 'premium_couples', lifetime: 'lifetime',
              };
              upgradePlan(planMap[selectedPlan] || 'premium_plus');
              completeOnboarding();
              router.replace('/(tabs)/(create)');
            }} />
        <Text style={styles.trialNote}>
          {selectedPlan === 'lifetime' ? 'One-time payment. No subscription.' : `Then ${ONBOARDING_PLANS.find(p => p.id === selectedPlan)?.price || '$8.99/mo'}. Cancel anytime.`}
        </Text>
        <View style={styles.paywallFooter}>
          <GhostButton label="Restore Purchases" onPress={handleComplete} style={styles.footerBtn} />
          <GhostButton label="Start Free" onPress={handleComplete} style={styles.footerBtn} />
        </View>
      </ScrollView>
    </View>
  );

  const slides = [renderWelcome, renderIntent, renderProfileSetup, renderNotifPermission, renderPaywall];

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Animated.View style={[styles.slideWrapper, { opacity: fadeAnim }]}>
          {slides[currentSlide]()}
        </Animated.View>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, currentSlide === i && styles.dotActive]} />
          ))}
        </View>
      </View>
    </ScreenBackground>
  );
}
