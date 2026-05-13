import React, { useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColors, ThemeShadows, fontSizes, spacing, radius } from '@/constants/theme';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import GoldBadge from '@/components/ui/GoldBadge';
import SectionTitle from '@/components/ui/SectionTitle';
import { useApp } from '@/context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2;

interface FeatureCard {
  id: string;
  icon: string;
  label: string;
  description: string;
  gradient: [string, string];
  route?: string;
  badge?: string;
}

function createStyles(c: ThemeColors, _s: ThemeShadows) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
    greetingSection: { paddingVertical: spacing.lg },
    greeting: { fontSize: fontSizes['2xl'], color: c.text_primary, fontWeight: '700' as const },
    greetingSub: { fontSize: fontSizes.sm, color: c.text_secondary, marginTop: spacing.xs },
    cardGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.md, marginBottom: spacing.xl },
    featureCard: { width: CARD_WIDTH, overflow: 'hidden' as const, position: 'relative' as const },
    featureCardInner: { padding: spacing.lg, gap: spacing.sm, minHeight: 150 },
    featureIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center' as const, justifyContent: 'center' as const },
    featureLabel: { fontSize: fontSizes.md, color: c.text_primary, fontWeight: '600' as const },
    featureDesc: { fontSize: fontSizes.xs, color: c.text_secondary, lineHeight: 16 },
    featureBadge: { position: 'absolute' as const, top: spacing.sm, right: spacing.sm },
    featureArrow: { position: 'absolute' as const, bottom: spacing.md, right: spacing.md },
    quickActionsRow: { flexDirection: 'row' as const, gap: spacing.sm, marginBottom: spacing.xl },
    quickAction: { flex: 1, padding: spacing.md, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm },
    quickActionLabel: { fontSize: fontSizes.sm, color: c.text_secondary, fontWeight: '500' as const, flex: 1 },
    partnerBanner: { padding: spacing.xl, marginBottom: spacing.xl, gap: spacing.md, overflow: 'hidden' as const },
    partnerGradient: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.xl, opacity: 0.1 },
    partnerTitle: { fontSize: fontSizes.lg, color: c.text_primary, fontWeight: '600' as const },
    partnerDesc: { fontSize: fontSizes.sm, color: c.text_secondary, lineHeight: 20 },
    bottomSpacer: { height: 40 },
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { profile } = useApp();

  const FEATURES: FeatureCard[] = useMemo(() => [
    { id: 'love-letter', icon: 'mail-outline', label: 'Love Letter', description: 'Write a heartfelt, personal letter', gradient: [colors.grad_rose_start, colors.grad_rose_end], route: '/create-mode?tool=love-letter' },
    { id: 'love-poem', icon: 'book-outline', label: 'Love Poem', description: 'Craft a romantic poem', gradient: [colors.grad_violet_start, colors.grad_violet_end], route: '/create-mode?tool=love-poem' },
    { id: 'love-note', icon: 'chatbox-outline', label: 'Love Note', description: 'A quick, genuine note', gradient: [colors.accent_rose, colors.grad_violet_end], route: '/create-mode?tool=love-note' },
    { id: 'love-quote', icon: 'text-outline', label: 'Love Quote', description: 'Generate a shareable quote', gradient: [colors.grad_gold_start, colors.grad_gold_end], route: '/create-mode?tool=love-quote' },
    { id: 'date-ideas', icon: 'location-outline', label: 'Date Ideas', description: 'Coming later as sponsored inspiration', gradient: [colors.success, '#2E9E96'], badge: 'SOON' },
    { id: 'conversation-starters', icon: 'people-outline', label: 'Starters', description: 'Coming later as HeartLoop teasers', gradient: [colors.accent_violet, colors.accent_rose], badge: 'SOON' },
  ], [colors]);

  const handleFeaturePress = useCallback((feature: FeatureCard) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (feature.route) router.push(feature.route as any);
    else Alert.alert('Coming Soon', 'This will become a light sponsored teaser later.');
  }, [router]);

  const scaleAnims = useRef(FEATURES.map(() => new Animated.Value(1))).current;

  const handlePressIn = useCallback((index: number) => {
    Animated.spring(scaleAnims[index], { toValue: 0.95, useNativeDriver: true }).start();
  }, [scaleAnims]);

  const handlePressOut = useCallback((index: number) => {
    Animated.spring(scaleAnims[index], { toValue: 1, useNativeDriver: true }).start();
  }, [scaleAnims]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>{greeting}{profile.name ? `, ${profile.name}` : ''}</Text>
            <Text style={styles.greetingSub}>Create something, take a test, or save a private prompt.</Text>
          </View>

          <SectionTitle title="Create Something Beautiful" />
          <View style={styles.cardGrid}>
            {FEATURES.map((feature, index) => (
              <Animated.View key={feature.id} style={{ transform: [{ scale: scaleAnims[index] }] }}>
                <TouchableOpacity
                  onPress={() => handleFeaturePress(feature)}
                  onPressIn={() => handlePressIn(index)}
                  onPressOut={() => handlePressOut(index)}
                  activeOpacity={1}
                >
                  <GlassCard style={styles.featureCard}>
                    <View style={styles.featureCardInner}>
                      {feature.badge && <GoldBadge label={feature.badge} style={styles.featureBadge} />}
                      <LinearGradient colors={feature.gradient} style={styles.featureIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Ionicons name={feature.icon as any} size={22} color="#FFFFFF" />
                      </LinearGradient>
                      <Text style={styles.featureLabel}>{feature.label}</Text>
                      <Text style={styles.featureDesc} numberOfLines={2}>{feature.description}</Text>
                    </View>
                    <View style={styles.featureArrow}>
                      <Ionicons name="arrow-forward-circle-outline" size={20} color={colors.text_muted} />
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          <SectionTitle title="Quick Actions" />
          <View style={styles.quickActionsRow}>
            <TouchableOpacity onPress={() => { void Haptics.selectionAsync(); router.push('/(tabs)/tests' as any); }} activeOpacity={0.8}>
              <GlassCard style={styles.quickAction}>
                <Ionicons name="heart-outline" size={18} color={colors.accent_rose} />
                <Text style={styles.quickActionLabel}>Take a Test</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text_muted} />
              </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { void Haptics.selectionAsync(); router.push('/(tabs)/daily' as any); }} activeOpacity={0.8}>
              <GlassCard style={styles.quickAction}>
                <Ionicons name="calendar-outline" size={18} color={colors.accent_violet} />
                <Text style={styles.quickActionLabel}>Daily Prompt</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text_muted} />
              </GlassCard>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert('Coming Soon', 'A lighter invite-only prompt mode will come later.');
            }}
            activeOpacity={0.8}
          >
            <GlassCard style={styles.partnerBanner}>
              <LinearGradient colors={[colors.grad_rose_start, colors.grad_violet_end]} style={styles.partnerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const }}>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm }}>
                    <Ionicons name="happy-outline" size={22} color={colors.accent_rose} />
                    <Text style={styles.partnerTitle}>Two-Player Prompts</Text>
                    <GoldBadge label="SOON" />
                  </View>
                  <Text style={styles.partnerDesc}>A lighter shared prompt mode is planned. Love Test AI stays free and local-first.</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.text_muted} />
              </View>
            </GlassCard>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </ScreenBackground>
  );
}
