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
    notifPreview: { padding: spacing.xl, marginBottom: spacing['2xl'], gap: spacing.sm },
    notifTitle: { color: c.text_primary, fontSize: fontSizes.md, fontWeight: '600' as const },
    notifBody: { color: c.text_secondary, fontSize: fontSizes.sm },
    notifTime: { color: c.text_muted, fontSize: fontSizes.xs, textTransform: 'uppercase' as const, letterSpacing: 1 },
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [intent, setIntent] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const finish = useCallback(() => {
    updateProfile({ ...profile, name, relationshipStatus: '', dateOfBirth: dob, intent });
    completeOnboarding();
    router.replace('/(tabs)/(home)');
  }, [completeOnboarding, dob, intent, name, profile, router, updateProfile]);

  const goToSlide = useCallback((index: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setCurrentSlide(index);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const handleNext = useCallback(() => {
    if (currentSlide < 3) goToSlide(currentSlide + 1);
    else finish();
  }, [currentSlide, finish, goToSlide]);

  const handleNotifications = useCallback(() => {
    finish();
  }, [finish]);

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
          <GhostButton label="Continue as guest" onPress={finish} />
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

  const renderNotifPermission = () => (
    <View style={styles.slideContainer}>
      <View style={styles.slideContent}>
        <Text style={styles.slideTitle}>Stay inspired daily</Text>
        <Text style={styles.slideSubtitle}>Get a fresh private prompt every morning</Text>
        <GlassCard style={styles.notifPreview}>
          <Text style={styles.notifTitle}>Today{"'"}s prompt is ready</Text>
          <Text style={styles.notifBody}>What is one small thing you appreciate about love today?</Text>
          <Text style={styles.notifTime}>Daily · 9:00 AM</Text>
        </GlassCard>
        <View style={styles.ctaGroup}>
          <GradientButton label="Allow Notifications" onPress={handleNotifications} />
          <GhostButton label="Not now" onPress={finish} />
        </View>
      </View>
    </View>
  );

  const slides = [renderWelcome, renderIntent, renderProfileSetup, renderNotifPermission];

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
