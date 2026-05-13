import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColors, ThemeShadows, fontSizes, spacing } from '@/constants/theme';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import GoldBadge from '@/components/ui/GoldBadge';
import GoldDivider from '@/components/ui/GoldDivider';
import SectionTitle from '@/components/ui/SectionTitle';
import HeartParticles from '@/components/ui/HeartParticles';
import { useApp } from '@/context/AppContext';

interface Achievement {
  id: string;
  icon: string;
  label: string;
  description: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  color: string;
}

function createStyles(c: ThemeColors, _s: ThemeShadows) {
  return StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.glass_fill, borderWidth: 1, borderColor: c.glass_border, alignItems: 'center' as const, justifyContent: 'center' as const },
    topBarTitle: { flex: 1, fontSize: fontSizes.lg, color: c.text_primary, fontWeight: '700' as const },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
    coupleCard: { padding: spacing.xl, alignItems: 'center' as const, marginBottom: spacing.xl, gap: spacing.md },
    avatarRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.lg },
    avatarCircle: { width: 60, height: 60, borderRadius: 30, padding: 2 },
    avatarInner: { flex: 1, borderRadius: 28, backgroundColor: c.bg_deep, alignItems: 'center' as const, justifyContent: 'center' as const },
    avatarText: { fontSize: fontSizes.xl, color: c.text_gold, fontWeight: '600' as const },
    heartConnect: { width: 32, height: 32, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const },
    partnerPlaceholder: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: c.glass_border, borderStyle: 'dashed' as const, alignItems: 'center' as const, justifyContent: 'center' as const },
    coupleNames: { fontSize: fontSizes.lg, color: c.text_primary, fontWeight: '600' as const, textAlign: 'center' as const },
    coupleStatus: { fontSize: fontSizes.sm, color: c.text_secondary, fontStyle: 'italic' as const },
    loveScoreSection: { marginBottom: spacing.xl },
    loveScoreCard: { padding: spacing.xl, alignItems: 'center' as const, gap: spacing.md },
    scoreCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center' as const, justifyContent: 'center' as const },
    scoreValue: { fontSize: fontSizes['3xl'], color: '#FFFFFF', fontWeight: '700' as const },
    scoreLabel: { fontSize: fontSizes.xs, color: '#FFFFFF', opacity: 0.8, textTransform: 'uppercase' as const, letterSpacing: 1 },
    scoreDesc: { fontSize: fontSizes.sm, color: c.text_secondary, textAlign: 'center' as const, lineHeight: 20 },
    streakRow: { flexDirection: 'row' as const, gap: spacing.md, marginBottom: spacing.xl },
    streakCard: { flex: 1, padding: spacing.lg, alignItems: 'center' as const, gap: spacing.xs },
    streakIcon: { marginBottom: spacing.xs },
    streakValue: { fontSize: fontSizes.xl, color: c.text_gold, fontWeight: '700' as const },
    streakLabel: { fontSize: fontSizes.xs, color: c.text_muted, textAlign: 'center' as const },
    achievementsGrid: { gap: spacing.md, marginBottom: spacing.xl },
    achievementCard: { padding: spacing.md, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md },
    achievementIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
    achievementIconLocked: { backgroundColor: c.glass_fill, borderWidth: 1, borderColor: c.glass_border },
    achievementInfo: { flex: 1 },
    achievementLabel: { fontSize: fontSizes.base, color: c.text_primary, fontWeight: '600' as const },
    achievementDesc: { fontSize: fontSizes.xs, color: c.text_muted, marginTop: 2 },
    progressBarOuter: { height: 4, backgroundColor: c.glass_fill, borderRadius: 2, marginTop: spacing.xs },
    progressBarInner: { height: 4, borderRadius: 2 },
    achievementCheck: { width: 28, height: 28, borderRadius: 14, alignItems: 'center' as const, justifyContent: 'center' as const },
    dailyPromptCard: { padding: spacing.xl, gap: spacing.md, marginBottom: spacing.xl },
    dailyPromptLabel: { fontSize: fontSizes.xs, color: c.text_muted, letterSpacing: 1.5, textTransform: 'uppercase' as const },
    dailyPromptText: { fontSize: fontSizes.lg, color: c.text_primary, fontWeight: '600' as const, fontStyle: 'italic' as const, lineHeight: 28 },
    dailyPromptMeta: { fontSize: fontSizes.xs, color: c.text_muted },
    actionsRow: { flexDirection: 'row' as const, gap: spacing.md, marginBottom: spacing.xl },
    actionCard: { flex: 1, padding: spacing.lg, alignItems: 'center' as const, gap: spacing.sm },
    actionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const },
    actionLabel: { fontSize: fontSizes.sm, color: c.text_primary, fontWeight: '500' as const, textAlign: 'center' as const },
    inviteSection: { marginBottom: spacing.xl },
    inviteCard: { padding: spacing.xl, alignItems: 'center' as const, gap: spacing.md },
    inviteTitle: { fontSize: fontSizes.lg, color: c.text_primary, fontWeight: '600' as const },
    inviteDesc: { fontSize: fontSizes.sm, color: c.text_secondary, textAlign: 'center' as const, lineHeight: 20 },
    bottomSpacer: { height: 40 },
  });
}

export default function PartnerDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { profile, streakData, savedCreations, completedTests } = useApp();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.spring(scoreAnim, { toValue: 1, useNativeDriver: true, damping: 12 }).start();
  }, [fadeAnim, scoreAnim]);

  const loveScore = useMemo(() => {
    let score = 50;
    score += Math.min(streakData.streak * 2, 20);
    score += Math.min(savedCreations.length * 3, 15);
    score += Math.min(completedTests * 5, 15);
    return Math.min(score, 100);
  }, [streakData.streak, savedCreations.length, completedTests]);

  const achievements: Achievement[] = useMemo(() => [
    { id: 'first_creation', icon: 'create-outline', label: 'First Creation', description: 'Write your first love letter or poem', progress: Math.min(savedCreations.length, 1), maxProgress: 1, unlocked: savedCreations.length >= 1, color: colors.accent_rose },
    { id: 'streak_7', icon: 'flame-outline', label: 'Week of Love', description: 'Maintain a 7-day streak', progress: Math.min(streakData.streak, 7), maxProgress: 7, unlocked: streakData.streak >= 7, color: colors.accent_gold },
    { id: 'test_3', icon: 'ribbon-outline', label: 'Self-Discovery', description: 'Complete 3 compatibility tests', progress: Math.min(completedTests, 3), maxProgress: 3, unlocked: completedTests >= 3, color: colors.accent_violet },
    { id: 'create_10', icon: 'heart-outline', label: 'Devoted Writer', description: 'Create 10 love expressions', progress: Math.min(savedCreations.length, 10), maxProgress: 10, unlocked: savedCreations.length >= 10, color: colors.success },
    { id: 'streak_30', icon: 'trophy-outline', label: 'Love Champion', description: '30-day reflection streak', progress: Math.min(streakData.streak, 30), maxProgress: 30, unlocked: streakData.streak >= 30, color: colors.accent_gold },
    { id: 'all_tests', icon: 'shield-checkmark-outline', label: 'Know Thyself', description: 'Complete all 6 tests', progress: Math.min(completedTests, 6), maxProgress: 6, unlocked: completedTests >= 6, color: colors.accent_rose },
  ], [savedCreations.length, streakData.streak, completedTests, colors]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const initials = (profile.name || 'ME').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleInvite = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Invite Partner', 'Share a link with your partner so they can join your couple dashboard.', [
      { text: 'Copy Link', onPress: () => Alert.alert('Copied', 'Invite link copied to clipboard.') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const scoreScale = scoreAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <HeartParticles />
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text_primary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Partner Mode</Text>
          <GoldBadge label="COUPLES" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <GlassCard style={styles.coupleCard}>
              <View style={styles.avatarRow}>
                <LinearGradient colors={[colors.accent_rose, colors.accent_violet]} style={styles.avatarCircle}>
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                </LinearGradient>
                <LinearGradient colors={[colors.accent_rose, colors.accent_violet]} style={styles.heartConnect}>
                  <Ionicons name="heart" size={16} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.partnerPlaceholder}>
                  <Ionicons name="add" size={24} color={colors.text_muted} />
                </View>
              </View>
              <Text style={styles.coupleNames}>{profile.name || 'You'} & Partner</Text>
              <Text style={styles.coupleStatus}>Invite your partner to connect</Text>
            </GlassCard>

            <View style={styles.loveScoreSection}>
              <SectionTitle title="Love Score" />
              <GlassCard style={styles.loveScoreCard}>
                <Animated.View style={{ transform: [{ scale: scoreScale }] }}>
                  <LinearGradient colors={[colors.grad_rose_start, colors.grad_violet_end]} style={styles.scoreCircle}>
                    <Text style={styles.scoreValue}>{loveScore}</Text>
                    <Text style={styles.scoreLabel}>SCORE</Text>
                  </LinearGradient>
                </Animated.View>
                <Text style={styles.scoreDesc}>
                  {loveScore >= 80 ? 'Amazing! Your dedication to love is inspiring.' :
                   loveScore >= 60 ? 'Great progress! Keep expressing and growing.' :
                   'Start creating, reflecting, and discovering to boost your score.'}
                </Text>
              </GlassCard>
            </View>

            <View style={styles.streakRow}>
              <GlassCard style={styles.streakCard}>
                <Ionicons name="flame" size={24} color={colors.accent_gold} style={styles.streakIcon} />
                <Text style={styles.streakValue}>{streakData.streak}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
              </GlassCard>
              <GlassCard style={styles.streakCard}>
                <Ionicons name="create" size={24} color={colors.accent_violet} style={styles.streakIcon} />
                <Text style={styles.streakValue}>{savedCreations.length}</Text>
                <Text style={styles.streakLabel}>Creations</Text>
              </GlassCard>
              <GlassCard style={styles.streakCard}>
                <Ionicons name="trophy" size={24} color={colors.accent_rose} style={styles.streakIcon} />
                <Text style={styles.streakValue}>{unlockedCount}/{achievements.length}</Text>
                <Text style={styles.streakLabel}>Badges</Text>
              </GlassCard>
            </View>

            <SectionTitle title="Today's Couple Prompt" />
            <GlassCard style={styles.dailyPromptCard}>
              <Text style={styles.dailyPromptLabel}>SHARED PROMPT</Text>
              <GoldDivider />
              <Text style={styles.dailyPromptText}>
                What is one thing your partner did this week that made you feel truly loved?
              </Text>
              <Text style={styles.dailyPromptMeta}>Both answer privately, then reveal together</Text>
              <GradientButton label="Respond to Prompt" onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Prompt', 'Your response will be shared with your partner after they respond too.');
              }} />
            </GlassCard>

            <SectionTitle title="Quick Actions" />
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => { void Haptics.selectionAsync(); router.push('/create-mode?tool=love-note' as any); }} activeOpacity={0.8}>
                <GlassCard style={styles.actionCard}>
                  <LinearGradient colors={[colors.accent_rose, colors.grad_rose_end]} style={styles.actionIcon}>
                    <Ionicons name="chatbox-outline" size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.actionLabel}>Send a Note</Text>
                </GlassCard>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { void Haptics.selectionAsync(); router.push('/create-mode?tool=date-ideas' as any); }} activeOpacity={0.8}>
                <GlassCard style={styles.actionCard}>
                  <LinearGradient colors={[colors.accent_violet, colors.grad_violet_end]} style={styles.actionIcon}>
                    <Ionicons name="location-outline" size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.actionLabel}>Plan a Date</Text>
                </GlassCard>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { void Haptics.selectionAsync(); router.push('/(tabs)/tests' as any); }} activeOpacity={0.8}>
                <GlassCard style={styles.actionCard}>
                  <LinearGradient colors={[colors.success, '#2E9E96']} style={styles.actionIcon}>
                    <Ionicons name="people-outline" size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.actionLabel}>Couple Test</Text>
                </GlassCard>
              </TouchableOpacity>
            </View>

            <SectionTitle title="Achievements" />
            <View style={styles.achievementsGrid}>
              {achievements.map((a) => (
                <GlassCard key={a.id} style={styles.achievementCard}>
                  {a.unlocked ? (
                    <LinearGradient colors={[a.color, `${a.color}88`]} style={styles.achievementIcon}>
                      <Ionicons name={a.icon as any} size={22} color="#FFFFFF" />
                    </LinearGradient>
                  ) : (
                    <View style={[styles.achievementIcon, styles.achievementIconLocked]}>
                      <Ionicons name={a.icon as any} size={22} color={colors.text_muted} />
                    </View>
                  )}
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementLabel}>{a.label}</Text>
                    <Text style={styles.achievementDesc}>{a.description}</Text>
                    {!a.unlocked && (
                      <View style={styles.progressBarOuter}>
                        <View style={[styles.progressBarInner, { width: `${(a.progress / a.maxProgress) * 100}%`, backgroundColor: a.color }]} />
                      </View>
                    )}
                  </View>
                  {a.unlocked ? (
                    <LinearGradient colors={[colors.success, '#2E9E96']} style={styles.achievementCheck}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  ) : (
                    <Text style={{ fontSize: fontSizes.xs, color: colors.text_muted }}>{a.progress}/{a.maxProgress}</Text>
                  )}
                </GlassCard>
              ))}
            </View>

            <View style={styles.inviteSection}>
              <GlassCard style={styles.inviteCard}>
                <Ionicons name="mail-outline" size={32} color={colors.accent_rose} />
                <Text style={styles.inviteTitle}>Invite Your Partner</Text>
                <Text style={styles.inviteDesc}>Connect with your partner to unlock shared prompts, joint streaks, and couple achievements.</Text>
                <GradientButton label="Send Invite Link" onPress={handleInvite} />
              </GlassCard>
            </View>

            <View style={styles.bottomSpacer} />
          </Animated.View>
        </ScrollView>
      </View>
    </ScreenBackground>
  );
}
