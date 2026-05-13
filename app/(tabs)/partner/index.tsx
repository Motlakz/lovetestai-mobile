import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Share, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import GhostButton from '@/components/ui/GhostButton';
import { useTheme } from '@/context/ThemeContext';
import { fontSizes, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { usePartnerStore } from '@/store/partnerStore';
import { useAuthGate } from '@/components/auth/AuthGateModal';
import { useToast } from '@/components/ui/Toast';
import { useAppAlert } from '@/components/ui/AppAlertModal';
import { useApp } from '@/context/AppContext';
import { DAILY_PROMPTS } from '@/mocks/tests';

const CODE_RE = /^[A-Z0-9]{6}$/;

export default function PartnerLiteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const { confirm } = useAppAlert();
  const account = useAuthStore((s) => s.account);
  const link = usePartnerStore((s) => s.link);
  const ensureInviteCode = usePartnerStore((s) => s.ensureInviteCode);
  const acceptCode = usePartnerStore((s) => s.acceptCode);
  const disconnect = usePartnerStore((s) => s.disconnect);
  const { openSignIn } = useAuthGate();
  const { todayPromptIndex, savedCreations, completedTests, streakData } = useApp();
  const [codeInput, setCodeInput] = useState('');
  const [labelInput, setLabelInput] = useState('');

  const isPaired = !!link?.pairedAt && !!link.partnerCode;

  useEffect(() => {
    if (account && !link?.inviteCode) {
      void ensureInviteCode();
    }
  }, [account, link?.inviteCode, ensureInviteCode]);

  const todayPrompt = useMemo(() => DAILY_PROMPTS[todayPromptIndex % DAILY_PROMPTS.length], [todayPromptIndex]);

  const loveScore = useMemo(() => {
    let score = 50;
    score += Math.min(streakData.streak * 2, 20);
    score += Math.min(savedCreations.length * 3, 15);
    score += Math.min(completedTests * 5, 15);
    return Math.min(score, 100);
  }, [streakData.streak, savedCreations.length, completedTests]);

  const scoreCopy = useMemo(() => {
    if (loveScore >= 80) return 'Amazing! Keep this glow.';
    if (loveScore >= 60) return 'Great progress together.';
    return 'Start creating to grow your score.';
  }, [loveScore]);

  const achievements = useMemo(() => ([
    {
      id: 'first_creation',
      label: 'First Spark',
      icon: 'sparkles' as const,
      earned: savedCreations.length >= 1,
    },
    {
      id: 'streak_7',
      label: '7-Day Streak',
      icon: 'flame' as const,
      earned: streakData.streak >= 7,
    },
    {
      id: 'tests_3',
      label: 'Three Tests',
      icon: 'ribbon' as const,
      earned: completedTests >= 3,
    },
  ]), [savedCreations.length, streakData.streak, completedTests]);

  const handleSignIn = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await openSignIn();
    if (ok) toast.success('Account ready. Generate an invite below.');
  }, [openSignIn, toast]);

  const handleCopyInvite = useCallback(async () => {
    if (!link?.inviteCode) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `Join me on Love Test AI. Use my pair code: ${link.inviteCode}`;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text);
      } else {
        await Clipboard.setStringAsync(text);
      }
      toast.success('Invite copied.');
    } catch { toast.error('Copy failed.'); }
  }, [link?.inviteCode, toast]);

  const handleShareInvite = useCallback(async () => {
    if (!link?.inviteCode) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `Join me on Love Test AI. Use my pair code: ${link.inviteCode}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Love Test AI pair code', text });
      } else if (Platform.OS !== 'web') {
        await Share.share({ message: text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Invite copied.');
      }
    } catch (e: any) {
      if (e?.message !== 'User did not share') console.log('Share error:', e);
    }
  }, [link?.inviteCode, toast]);

  const handleAcceptCode = useCallback(async () => {
    const normalized = codeInput.trim().toUpperCase();
    if (!CODE_RE.test(normalized)) {
      toast.warning('Enter a 6-character code.');
      return;
    }
    if (link?.inviteCode && normalized === link.inviteCode) {
      toast.warning('That\'s your own code.');
      return;
    }
    try {
      await acceptCode(normalized, labelInput);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success(`Paired${labelInput ? ` with ${labelInput.trim()}` : ''}.`);
      setCodeInput('');
      setLabelInput('');
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not pair. Try again.');
    }
  }, [codeInput, labelInput, link?.inviteCode, acceptCode, toast]);

  const handleDisconnect = useCallback(async () => {
    const ok = await confirm('Disconnect partner?', 'Your invite code stays the same. You can pair again anytime.');
    if (!ok) return;
    await disconnect();
    toast.info('Partner disconnected.');
  }, [confirm, disconnect, toast]);

  const handleSharePrompt = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `Today's reflection from Love Test AI:\n\n"${todayPrompt.text}"\n\nReply with your reflection and I'll share mine.`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'A prompt to share', text });
      } else if (Platform.OS !== 'web') {
        await Share.share({ message: text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Prompt copied. Send it to your partner.');
      }
    } catch (e: any) {
      if (e?.message !== 'User did not share') console.log('Share error:', e);
    }
  }, [todayPrompt, toast]);

  const codeChars = useMemo(() => (link?.inviteCode ?? '').split(''), [link?.inviteCode]);

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons name="happy-outline" size={36} color={colors.accent_rose} />
          <Text style={[styles.title, { color: colors.text_primary }]}>Two-Player Prompts</Text>
          <Text style={[styles.subtitle, { color: colors.text_secondary }]}>
            Send a prompt to someone you love and compare reflections.
          </Text>
        </View>

        {!isPaired && (
          <View style={[styles.guideStrip, { backgroundColor: `${colors.accent_violet}12`, borderColor: `${colors.accent_violet}40` }]}>
            <View style={styles.guideStep}>
              <View style={[styles.stepDot, { backgroundColor: colors.accent_violet }]}><Text style={styles.stepDotText}>1</Text></View>
              <Text style={[styles.stepLabel, { color: colors.text_secondary }]}>Sign in</Text>
            </View>
            <View style={[styles.stepDivider, { backgroundColor: `${colors.accent_violet}40` }]} />
            <View style={styles.guideStep}>
              <View style={[styles.stepDot, { backgroundColor: colors.accent_rose }]}><Text style={styles.stepDotText}>2</Text></View>
              <Text style={[styles.stepLabel, { color: colors.text_secondary }]}>Share code</Text>
            </View>
            <View style={[styles.stepDivider, { backgroundColor: `${colors.accent_violet}40` }]} />
            <View style={styles.guideStep}>
              <View style={[styles.stepDot, { backgroundColor: colors.accent_gold }]}><Text style={styles.stepDotText}>3</Text></View>
              <Text style={[styles.stepLabel, { color: colors.text_secondary }]}>Reflect together</Text>
            </View>
          </View>
        )}

        {!account && (
          <GlassCard style={styles.card}>
            <Ionicons name="lock-closed-outline" size={28} color={colors.accent_violet} />
            <Text style={[styles.cardTitle, { color: colors.text_primary }]}>Sign in to invite a partner</Text>
            <Text style={[styles.cardBody, { color: colors.text_secondary }]}>
              Pairing needs an account so we can sync prompts between both of you. Browsing daily prompts on your own does not.
            </Text>
            <GradientButton label="Sign in to continue" onPress={handleSignIn} />
            <GhostButton label="Browse prompts alone" onPress={() => router.push('/(tabs)/daily' as any)} />
          </GlassCard>
        )}

        {account && !isPaired && (
          <>
            <GlassCard style={styles.card}>
              <Text style={[styles.cardTitle, { color: colors.text_primary }]}>Your pair code</Text>
              <Text style={[styles.cardBody, { color: colors.text_secondary }]}>
                Share this code with the person you want to reflect with. They enter it on their device to pair.
              </Text>
              <View style={[styles.codeBlock, { borderColor: colors.accent_gold, backgroundColor: `${colors.accent_gold}10` }]}>
                {codeChars.map((ch, i) => (
                  <View key={i} style={[styles.codeChar, { borderColor: colors.glass_border, backgroundColor: colors.glass_fill }]}>
                    <Text style={[styles.codeCharText, { color: colors.text_primary }]}>{ch}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.rowActions}>
                <GhostButton label="Copy" onPress={handleCopyInvite} style={styles.flexBtn} />
                <GradientButton label="Share invite" onPress={handleShareInvite} small />
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={[styles.cardTitle, { color: colors.text_primary }]}>Enter their code</Text>
              <Text style={[styles.cardBody, { color: colors.text_secondary }]}>
                Got a pair code from someone? Paste it below to start sharing prompts.
              </Text>
              <TextInput
                value={codeInput}
                onChangeText={(t) => setCodeInput(t.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase())}
                placeholder="A1B2C3"
                placeholderTextColor={colors.text_muted}
                autoCapitalize="characters"
                maxLength={6}
                style={[styles.input, styles.codeInput, { backgroundColor: colors.glass_fill, borderColor: colors.glass_border, color: colors.text_primary }]}
              />
              <TextInput
                value={labelInput}
                onChangeText={setLabelInput}
                placeholder="Their name (optional)"
                placeholderTextColor={colors.text_muted}
                maxLength={40}
                style={[styles.input, { backgroundColor: colors.glass_fill, borderColor: colors.glass_border, color: colors.text_primary }]}
              />
              <GradientButton label="Pair now" onPress={handleAcceptCode} disabled={!CODE_RE.test(codeInput)} />
            </GlassCard>
          </>
        )}

        {account && isPaired && link && (
          <>
            <GlassCard style={styles.card}>
              <View style={styles.pairedBadge}>
                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                <Text style={[styles.pairedLabel, { color: colors.success }]}>Paired</Text>
              </View>
              <View style={styles.coupleRow}>
                <LinearGradient
                  colors={[colors.accent_rose, colors.accent_violet]}
                  style={styles.avatar}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarInitial}>
                    {(account.displayName ?? account.email ?? 'Y').charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
                <LinearGradient
                  colors={[colors.accent_rose, colors.accent_violet]}
                  style={styles.heartConnector}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="heart" size={16} color="#fff" />
                </LinearGradient>
                <LinearGradient
                  colors={[colors.accent_violet, colors.accent_rose]}
                  style={styles.avatar}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarInitial}>
                    {(link.partnerLabel ?? link.partnerEmail ?? 'P').charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>
              <Text style={[styles.coupleName, { color: colors.text_primary }]}>
                You & {link.partnerLabel ?? 'your partner'}
              </Text>
              <Text style={[styles.cardBody, { color: colors.text_secondary, textAlign: 'center' }]}>
                Since {new Date(link.pairedAt!).toLocaleDateString()}
              </Text>
            </GlassCard>

            <GlassCard style={styles.card}>
              <View style={styles.scoreHeader}>
                <Ionicons name="heart-circle" size={24} color={colors.accent_rose} />
                <Text style={[styles.cardTitle, { color: colors.text_primary }]}>Love Score</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreValue, { color: colors.accent_rose }]}>{loveScore}</Text>
                <Text style={[styles.scoreUnit, { color: colors.text_muted }]}>/ 100</Text>
              </View>
              <View style={[styles.scoreBar, { backgroundColor: colors.glass_fill, borderColor: colors.glass_border }]}>
                <LinearGradient
                  colors={[colors.accent_rose, colors.accent_violet]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.scoreFill, { width: `${loveScore}%` }]}
                />
              </View>
              <Text style={[styles.scoreCopy, { color: colors.text_secondary }]}>{scoreCopy}</Text>
            </GlassCard>

            <View style={styles.achievementRow}>
              {achievements.map((a) => (
                <View
                  key={a.id}
                  style={[
                    styles.achievementBadge,
                    {
                      backgroundColor: a.earned ? `${colors.accent_gold}18` : colors.glass_fill,
                      borderColor: a.earned ? colors.accent_gold : colors.glass_border,
                    },
                  ]}
                >
                  <Ionicons
                    name={a.icon}
                    size={20}
                    color={a.earned ? colors.accent_gold : colors.text_muted}
                  />
                  <Text style={[
                    styles.achievementLabel,
                    { color: a.earned ? colors.text_primary : colors.text_muted },
                  ]}>
                    {a.label}
                  </Text>
                </View>
              ))}
            </View>

            <GlassCard style={styles.card}>
              <Text style={[styles.cardTitle, { color: colors.text_primary }]}>Today&apos;s shared prompt</Text>
              <Text style={[styles.promptText, { color: colors.text_primary }]}>
                &quot;{todayPrompt.text}&quot;
              </Text>
              <GradientButton label="Send to partner" onPress={handleSharePrompt} />
              <GhostButton label="Browse more prompts" onPress={() => router.push('/(tabs)/daily' as any)} />
            </GlassCard>

            <GhostButton label="Disconnect partner" onPress={handleDisconnect} style={styles.disconnect} />
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  header: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  title: { fontSize: fontSizes['2xl'], fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: fontSizes.sm, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  card: { padding: spacing.xl, gap: spacing.md, marginBottom: spacing.lg },
  cardTitle: { fontSize: fontSizes.lg, fontWeight: '600' },
  cardBody: { fontSize: fontSizes.sm, lineHeight: 20 },
  codeBlock: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  codeChar: {
    width: 40,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCharText: { fontSize: fontSizes.xl, fontWeight: '700', letterSpacing: 1 },
  rowActions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  flexBtn: { flex: 1 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSizes.base,
  },
  codeInput: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 6,
  },
  pairedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pairedLabel: { fontSize: fontSizes.xs, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  promptText: { fontSize: fontSizes.md, lineHeight: 24, fontStyle: 'italic' },
  disconnect: { alignSelf: 'center' },
  coupleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: fontSizes.xl, fontWeight: '700' },
  heartConnector: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coupleName: { fontSize: fontSizes.lg, fontWeight: '700', textAlign: 'center', marginTop: spacing.xs },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  scoreValue: { fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  scoreUnit: { fontSize: fontSizes.md, fontWeight: '600' },
  scoreBar: {
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scoreFill: { height: '100%', borderRadius: 4 },
  scoreCopy: { fontSize: fontSizes.sm, fontStyle: 'italic' },
  achievementRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  achievementBadge: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  achievementLabel: { fontSize: fontSizes.xs, fontWeight: '600', textAlign: 'center' },
  guideStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  guideStep: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: { color: '#fff', fontSize: fontSizes.xs, fontWeight: '700' },
  stepLabel: { fontSize: fontSizes.xs, fontWeight: '600' },
  stepDivider: { width: 16, height: 1 },
});
