import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
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
import { useInboxStore, unreadCount } from '@/store/inboxStore';
import InboxModal from '@/components/ui/InboxModal';
import { trackEvent, trackGeneratorOpened, trackScreen } from '@/services/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

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
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
    headerRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, justifyContent: 'space-between' as const, paddingTop: spacing.md, gap: spacing.md },
    headerGreeting: { flex: 1, fontSize: fontSizes['2xl'], color: c.text_primary, fontWeight: '700' as const, flexWrap: 'wrap' as const, lineHeight: fontSizes['2xl'] * 1.2 },
    headerIconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: c.glass_border, backgroundColor: c.glass_fill, position: 'relative' as const },
    headerBadge: { position: 'absolute' as const, top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: c.accent_rose, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 2, borderColor: c.bg_deep },
    headerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' as const, lineHeight: 12 },
    greetingSection: { paddingTop: spacing.md, paddingBottom: spacing.lg },
    greetingSub: { fontSize: fontSizes.sm, color: c.text_secondary },
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
    quickActionLabel: { fontSize: fontSizes.sm, color: c.text_secondary, fontWeight: '500' as const },
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
  const [inboxOpen, setInboxOpen] = useState(false);
  const unread = useInboxStore(s => unreadCount(s.items));

  const FEATURES: FeatureCard[] = useMemo(() => [
    { id: 'love-letter', icon: 'mail-outline', label: 'Love Letter', description: 'Write a heartfelt, personal letter', gradient: [colors.grad_rose_start, colors.grad_rose_end], route: '/create-mode?tool=love-letter' },
    { id: 'love-poem', icon: 'book-outline', label: 'Love Poem', description: 'Craft a romantic poem', gradient: [colors.grad_violet_start, colors.grad_violet_end], route: '/create-mode?tool=love-poem' },
    { id: 'love-note', icon: 'chatbox-outline', label: 'Love Note', description: 'A quick, genuine note', gradient: [colors.accent_rose, colors.grad_violet_end], route: '/create-mode?tool=love-note' },
    { id: 'love-quote', icon: 'text-outline', label: 'Love Quote', description: 'Generate a shareable quote', gradient: [colors.grad_gold_start, colors.grad_gold_end], route: '/create-mode?tool=love-quote' },
  ], [colors]);

  useEffect(() => {
    trackScreen('home', { generator_count: FEATURES.length });
  }, [FEATURES.length]);

  const handleFeaturePress = useCallback((feature: FeatureCard) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackGeneratorOpened(feature.id);
    trackEvent('home_generator_selected', { generator_type: feature.id });
    if (feature.route) router.push(feature.route as any);
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
          <View style={styles.headerRow}>
            <Text style={styles.headerGreeting}>
              {greeting}{profile.name ? `, ${profile.name}` : ''}
            </Text>
            <TouchableOpacity
              onPress={() => { void Haptics.selectionAsync(); trackEvent('home_inbox_opened', { unread_count: unread }); setInboxOpen(true); }}
              style={styles.headerIconBtn}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text_secondary} />
              {unread > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.greetingSection}>
            <Text style={styles.greetingSub}>Write to your loved one, test your compatibility, or find some love prompts.</Text>
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
            <TouchableOpacity style={{ flex: 1 }} onPress={() => { void Haptics.selectionAsync(); trackEvent('home_quick_action', { action: 'tests' }); router.push('/(tabs)/tests' as any); }} activeOpacity={0.8}>
              <GlassCard style={styles.quickAction}>
                <Ionicons name="heart-outline" size={18} color={colors.accent_rose} />
                <Text style={styles.quickActionLabel}>Take Love Test</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text_muted} />
              </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => { void Haptics.selectionAsync(); trackEvent('home_quick_action', { action: 'daily_prompt' }); router.push('/(tabs)/daily' as any); }} activeOpacity={0.8}>
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
              trackEvent('home_quick_action', { action: 'partner_prompts' });
              router.push('/(tabs)/partner' as any);
            }}
            activeOpacity={0.8}
          >
            <GlassCard style={styles.partnerBanner}>
              <LinearGradient colors={[colors.grad_rose_start, colors.grad_violet_end]} style={styles.partnerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const }}>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm }}>
                    <Ionicons name="happy-outline" size={22} color={colors.accent_rose} />
                    <Text style={styles.partnerTitle}>Partner Prompts</Text>
                  </View>
                  <Text style={styles.partnerDesc}>Send a prompt to someone and compare reflections together.</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.text_muted} />
              </View>
            </GlassCard>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
      <InboxModal visible={inboxOpen} onClose={() => setInboxOpen(false)} />
    </ScreenBackground>
  );
}
