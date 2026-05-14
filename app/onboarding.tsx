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
import HeartParticles from '@/components/ui/HeartParticles';
import ScreenBackground from '@/components/ui/ScreenBackground';
import { useApp } from '@/context/AppContext';
import { useAuthGate } from '@/components/auth/AuthGateModal';
import { useAuthStore } from '@/store/authStore';
import {
  DEFAULT_NOTIF_PREFS,
  NOTIF_FREQUENCY_OPTIONS,
  NOTIF_TIME_PRESETS,
  type NotifFrequency,
  savePrefs as saveNotifPrefs,
} from '@/services/notifications';
import { useToast } from '@/components/ui/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INTENTS = [
  { id: 'express', icon: 'heart-outline' as const, label: 'Express My Love', sub: 'Letters, poems, notes & quotes' },
  { id: 'discover', icon: 'analytics-outline' as const, label: 'Take Love Tests', sub: 'Calculators, quizzes & compatibility' },
  { id: 'prompts', icon: 'sparkles-outline' as const, label: 'Find Prompts', sub: 'Reflect, save and share inspiration' },
  { id: 'all', icon: 'infinite-outline' as const, label: 'All of the Above', sub: 'The full Love Test AI experience' },
];

function createStyles(c: ThemeColors, s: ThemeShadows) {
  return StyleSheet.create({
    container: { flex: 1 },
    slideWrapper: { flex: 1 },
    slideContainer: { flex: 1, paddingHorizontal: spacing.xl },
    slideContent: { flex: 1, justifyContent: 'center' as const },
    logoContainer: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: c.accent_gold, alignItems: 'center' as const, justifyContent: 'center' as const, alignSelf: 'center' as const, marginBottom: spacing.xl, backgroundColor: `${c.accent_gold}14` },
    logoMark: { fontSize: fontSizes.display, color: c.accent_gold, fontWeight: '700' as const },
    appName: { fontSize: fontSizes.display, color: c.text_primary, fontWeight: '700' as const, textAlign: 'center' as const, marginBottom: spacing.sm },
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
    fieldGroup: { marginBottom: spacing.xl },
    fieldLabel: { fontSize: fontSizes.sm, color: c.text_secondary, fontWeight: '500' as const, marginBottom: spacing.sm },
    textInput: { backgroundColor: c.glass_fill, borderWidth: 1, borderColor: c.glass_border, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, color: c.text_primary, fontSize: fontSizes.base },
    profileScroll: { flex: 1 },
    profileScrollContent: { flexGrow: 1, justifyContent: 'center' as const, paddingVertical: spacing.xl, paddingHorizontal: spacing.xs },
    ctaRow: { flexDirection: 'row' as const, gap: spacing.md, marginTop: spacing.lg },
    skipBtn: { alignSelf: 'center' as const, marginTop: spacing.md, borderWidth: 0 },
    notifPreview: { padding: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
    notifTitle: { color: c.text_primary, fontSize: fontSizes.md, fontWeight: '600' as const },
    notifBody: { color: c.text_secondary, fontSize: fontSizes.sm },
    notifTime: { color: c.text_muted, fontSize: fontSizes.xs, textTransform: 'uppercase' as const, letterSpacing: 1 },
    notifSectionLabel: { color: c.text_muted, fontSize: fontSizes.xs, letterSpacing: 1.5, textTransform: 'uppercase' as const, fontWeight: '600' as const, marginTop: spacing.md, marginBottom: spacing.sm },
    chipRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm, marginBottom: spacing.md },
    chip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.full, borderWidth: 1, borderColor: c.glass_border, backgroundColor: c.glass_fill },
    chipActive: { borderColor: c.accent_rose, backgroundColor: 'rgba(255,61,127,0.14)' },
    chipText: { color: c.text_muted, fontSize: fontSizes.sm, fontWeight: '500' as const },
    chipTextActive: { color: c.text_primary, fontWeight: '600' as const },
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
  const { completeOnboarding, updateProfile, profile } = useApp();
  const signInAnonymously = useAuthStore((s) => s.signInAnonymously);
  const { openSignIn } = useAuthGate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [intent, setIntent] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [notifHour, setNotifHour] = useState(DEFAULT_NOTIF_PREFS.hour);
  const [notifMinute, setNotifMinute] = useState(DEFAULT_NOTIF_PREFS.minute);
  const [notifFrequency, setNotifFrequency] = useState<NotifFrequency>(DEFAULT_NOTIF_PREFS.frequency);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const toast = useToast();

  const finish = useCallback(() => {
    updateProfile({ ...profile, name, relationshipStatus: '', dateOfBirth: dob, intent });
    completeOnboarding();
    router.replace('/(tabs)/(home)');
  }, [completeOnboarding, dob, intent, name, profile, router, updateProfile]);

  const finishAsGuest = useCallback(async () => {
    setIsFinishing(true);
    try {
      await signInAnonymously();
      finish();
    } catch (e) {
      console.log('Guest onboarding sign-in failed:', e);
      finish();
    } finally {
      setIsFinishing(false);
    }
  }, [finish, signInAnonymously]);

  const finishWithAccount = useCallback(async () => {
    setIsFinishing(true);
    try {
      const ok = await openSignIn();
      if (ok) finish();
    } finally {
      setIsFinishing(false);
    }
  }, [finish, openSignIn]);

  const goToSlide = useCallback((index: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setCurrentSlide(index);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const handleNext = useCallback(() => {
    if (currentSlide < 4) goToSlide(currentSlide + 1);
    else finish();
  }, [currentSlide, finish, goToSlide]);

  const handleAllowNotifications = useCallback(async () => {
    try {
      await saveNotifPrefs({
        enabled: true,
        hour: notifHour,
        minute: notifMinute,
        frequency: notifFrequency,
      });
      toast.success('Daily prompt reminder saved.');
    } catch (e) {
      console.log('Save notif prefs failed:', e);
    }
    goToSlide(4);
  }, [goToSlide, notifHour, notifMinute, notifFrequency, toast]);

  const handleSkipNotifications = useCallback(async () => {
    try {
      await saveNotifPrefs({ ...DEFAULT_NOTIF_PREFS, enabled: false });
    } catch (e) {
      console.log('Save notif prefs failed:', e);
    }
    goToSlide(4);
  }, [goToSlide]);

  const renderWelcome = () => (
    <View style={styles.slideContainer}>
      <HeartParticles />
      <View style={styles.slideContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoMark}>LT</Text>
        </View>
        <Text style={styles.appName}>Love Test AI</Text>
        <Text style={styles.tagline}>Playful love tests and romantic creations</Text>
        <Text style={styles.descriptors}>LOVE LETTERS  ·  COMPATIBILITY  ·  DAILY PROMPTS</Text>
        <View style={styles.ctaGroup}>
          <GradientButton label="Get Started" onPress={handleNext} />
        </View>
      </View>
    </View>
  );

  const renderIntent = () => (
    <View style={styles.slideContainer}>
      <View style={styles.slideContent}>
        <Text style={styles.slideTitle}>What brings you here?</Text>
        <Text style={styles.slideSubtitle}>We will personalize the shortcuts on this device</Text>
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
        <GradientButton label="Continue" onPress={handleNext} disabled={!intent} />
      </View>
    </View>
  );

  const renderProfileSetup = () => (
    <KeyboardAvoidingView style={styles.slideContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.profileScroll} contentContainerStyle={styles.profileScrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.slideTitle}>A little about you</Text>
        <Text style={styles.slideSubtitle}>Optional. You can also enter details inside each calculator.</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Your name</Text>
          <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="Your first name" placeholderTextColor={colors.text_muted} autoCapitalize="words" />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Date of birth</Text>
          <TextInput style={styles.textInput} value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" placeholderTextColor={colors.text_muted} keyboardType="numbers-and-punctuation" maxLength={10} />
          <Text style={[styles.fieldLabel, { fontSize: fontSizes.xs, color: colors.text_muted, marginTop: spacing.xs, marginBottom: 0 }]}>Only used locally for calculators that need it.</Text>
        </View>
        <View style={styles.ctaRow}>
          <GradientButton label="Continue" onPress={handleNext} style={{ flex: 1 }} />
        </View>
        <GhostButton label="Skip for now" onPress={handleNext} style={styles.skipBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderNotifPermission = () => {
    const selectedTime = NOTIF_TIME_PRESETS.find((t) => t.hour === notifHour && t.minute === notifMinute);
    const frequencyLabel = NOTIF_FREQUENCY_OPTIONS.find((f) => f.value === notifFrequency)?.label ?? 'Every day';
    return (
      <View style={styles.slideContainer}>
        <ScrollView style={styles.profileScroll} contentContainerStyle={styles.profileScrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.slideTitle}>Stay inspired</Text>
          <Text style={styles.slideSubtitle}>Pick when a private prompt should land in the app.</Text>
          <GlassCard style={styles.notifPreview}>
            <Text style={styles.notifTitle}>Today{"'"}s prompt is ready</Text>
            <Text style={styles.notifBody}>What is one small thing you appreciate about love today?</Text>
            <Text style={styles.notifTime}>{frequencyLabel} · {selectedTime?.label ?? `${String(notifHour).padStart(2, '0')}:${String(notifMinute).padStart(2, '0')}`}</Text>
          </GlassCard>

          <Text style={styles.notifSectionLabel}>Preferred time</Text>
          <View style={styles.chipRow}>
            {NOTIF_TIME_PRESETS.map((t) => {
              const active = t.hour === notifHour && t.minute === notifMinute;
              return (
                <TouchableOpacity
                  key={t.label}
                  onPress={() => { setNotifHour(t.hour); setNotifMinute(t.minute); }}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.notifSectionLabel}>How often</Text>
          <View style={styles.chipRow}>
            {NOTIF_FREQUENCY_OPTIONS.map((f) => {
              const active = f.value === notifFrequency;
              return (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => setNotifFrequency(f.value)}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.ctaGroup}>
            <GradientButton label="Turn on prompts" onPress={handleAllowNotifications} />
            <GhostButton label="Not now" onPress={handleSkipNotifications} />
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderAccountChoice = () => (
    <View style={styles.slideContainer}>
      <View style={styles.slideContent}>
        <Text style={styles.slideTitle}>Choose how to continue</Text>
        <Text style={styles.slideSubtitle}>Guest mode creates a private device identity. Creating an account uses Google.</Text>
        <View style={styles.ctaGroup}>
          <GradientButton
            label={isFinishing ? 'Continuing...' : 'Continue as guest'}
            onPress={finishAsGuest}
            disabled={isFinishing}
          />
          <GhostButton label="Create account" onPress={finishWithAccount} />
        </View>
      </View>
    </View>
  );

  const slides = [renderWelcome, renderIntent, renderProfileSetup, renderNotifPermission, renderAccountChoice];

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
