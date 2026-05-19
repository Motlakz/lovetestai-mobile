import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
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
import { useToast } from '@/components/ui/Toast';
import { useAppAlert } from '@/components/ui/AppAlertModal';
import { useApp } from '@/context/AppContext';
import { DAILY_PROMPTS } from '@/mocks/tests';
import {
  sharePartnerReflection,
  subscribeToPartnerExchange,
  subscribeToPartnerShares,
  todayExchangeKey,
  type PartnerExchange,
  type PartnerShare,
} from '@/services/partnerExchange';

const CODE_RE = /^[A-Z0-9]{6}$/;
type PairTab = 'create' | 'enter';

function mergeExchangeSnapshot(current: PartnerExchange | null, incoming: PartnerExchange | null): PartnerExchange | null {
  if (!incoming) return current;
  return {
    ...incoming,
    promptText: incoming.promptText ?? current?.promptText,
    promptCategory: incoming.promptCategory ?? current?.promptCategory,
    responses: {
      ...(current?.responses ?? {}),
      ...(incoming.responses ?? {}),
    },
  };
}

export default function PartnerLiteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const { confirm } = useAppAlert();
  const account = useAuthStore((s) => s.account);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const link = usePartnerStore((s) => s.link);
  const ensureInviteCode = usePartnerStore((s) => s.ensureInviteCode);
  const regenerateInviteCode = usePartnerStore((s) => s.regenerateInviteCode);
  const acceptCode = usePartnerStore((s) => s.acceptCode);
  const disconnect = usePartnerStore((s) => s.disconnect);
  const { todayPromptIndex, profile } = useApp();
  const [codeInput, setCodeInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [activeTab, setActiveTab] = useState<PairTab>('create');
  const [reflectionText, setReflectionText] = useState('');
  const [promptExchange, setPromptExchange] = useState<PartnerExchange | null>(null);
  const [shares, setShares] = useState<PartnerShare[]>([]);

  const isPaired = !!link?.pairedAt && !!link.partnerCode;

  const todayPrompt = useMemo(() => DAILY_PROMPTS[todayPromptIndex % DAILY_PROMPTS.length], [todayPromptIndex]);
  const todayKey = useMemo(() => todayExchangeKey(), []);
  const activePromptText = promptExchange?.promptText || todayPrompt.text;
  const activePromptCategory = promptExchange?.promptCategory || todayPrompt.category;
  const myResponse = account ? promptExchange?.responses?.[account.accountId]?.text ?? '' : '';
  const myDisplayName = profile.name.trim() || account?.displayName || account?.email || 'You';
  const partnerResponse = useMemo(() => {
    if (!promptExchange?.responses || !account) return '';
    const entries = Object.entries(promptExchange.responses);
    const other = entries.find(([uid]) => uid !== account.accountId);
    return other?.[1]?.text ?? '';
  }, [account, promptExchange?.responses]);
  const partnerDisplayName = useMemo(() => {
    if (!promptExchange?.responses || !account) return link?.partnerLabel ?? link?.partnerEmail ?? 'Partner';
    const entries = Object.entries(promptExchange.responses);
    const other = entries.find(([uid]) => uid !== account.accountId);
    return other?.[1]?.displayName || link?.partnerLabel || link?.partnerEmail || 'Partner';
  }, [account, link?.partnerEmail, link?.partnerLabel, promptExchange?.responses]);
  const responseKeys = useMemo(() => Object.keys(promptExchange?.responses ?? {}), [promptExchange?.responses]);
  const achievements = useMemo(() => ([
    {
      id: 'first_creation',
      label: 'First Share',
      icon: 'sparkles' as const,
      earned: !!myResponse,
    },
    {
      id: 'streak_7',
      label: 'Both Replied',
      icon: 'flame' as const,
      earned: !!myResponse && !!partnerResponse,
    },
    {
      id: 'tests_3',
      label: 'Prompt Live',
      icon: 'ribbon' as const,
      earned: !!promptExchange?.promptText,
    },
  ]), [myResponse, partnerResponse, promptExchange?.promptText]);

  useEffect(() => {
    if (!account || !link?.pairId || !link.pairId.includes(account.accountId)) {
      setPromptExchange(null);
      return;
    }

    const unsubscribe = subscribeToPartnerExchange(link.pairId, todayKey, (next) => {
      setPromptExchange((current) => mergeExchangeSnapshot(current, next));
      const savedText = next?.responses?.[account.accountId]?.text;
      if (savedText) setReflectionText((current) => current || savedText);
    }, (e) => {
      console.log('exchange listener:', e);
      toast.error('Could not load partner exchange.');
    });

    return unsubscribe;
  }, [account, link?.pairId, todayKey, toast]);

  useEffect(() => {
    if (!account || !link?.pairId || !link.pairId.includes(account.accountId)) {
      setShares([]);
      return;
    }
    const unsubscribe = subscribeToPartnerShares(link.pairId, setShares, (e) => {
      console.log('shares listener:', e);
    });
    return unsubscribe;
  }, [account, link?.pairId]);

  const handleCreateInvite = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCreatingInvite(true);
    try {
      await ensureInviteCode();
      toast.success('Pair code ready.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not create your invite code.');
    } finally {
      setIsCreatingInvite(false);
    }
  }, [ensureInviteCode, toast]);

  const handleRegenerateInvite = useCallback(async () => {
    const ok = await confirm('Generate a new code?', 'The previous code will no longer be shown on this device.');
    if (!ok) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCreatingInvite(true);
    try {
      await regenerateInviteCode();
      toast.success('New pair code ready.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not generate a new code.');
    } finally {
      setIsCreatingInvite(false);
    }
  }, [confirm, regenerateInviteCode, toast]);

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
    const text = `Today's reflection from Love Test AI:\n\n"${activePromptText}"\n\nReply with your reflection and I'll share mine.`;
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
  }, [activePromptText, toast]);

  const handleSaveReflection = useCallback(async () => {
    const text = reflectionText.trim();
    if (!text) {
      toast.warning('Write a reflection first.');
      return;
    }
    if (!account || !link?.pairId) {
      toast.error('Pair is not connected.');
      return;
    }
    if (!link.pairId.includes(account.accountId)) {
      toast.error('This pair belongs to a previous guest identity. Disconnect and pair again.');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSavingReflection(true);
    try {
      await sharePartnerReflection({
        pairId: link.pairId,
        exchangeId: todayKey,
        promptText: activePromptText,
        promptCategory: activePromptCategory,
        account,
        displayName: myDisplayName,
        text,
      });
      setPromptExchange((prev) => ({
        ...prev,
        promptText: activePromptText,
        promptCategory: activePromptCategory,
        responses: {
          ...(prev?.responses ?? {}),
          [account.accountId]: {
            displayName: myDisplayName,
            text,
          },
        },
      }));
      setReflectionText('');
      toast.success('Reflection shared in Partner Mode.');
    } catch (e) {
      console.log('reflection write failed:', e);
      toast.error('Could not share this reflection.');
    } finally {
      setIsSavingReflection(false);
    }
  }, [account, activePromptCategory, activePromptText, link?.pairId, myDisplayName, reflectionText, todayKey, toast]);

  const codeChars = useMemo(() => (link?.inviteCode ?? '').split(''), [link?.inviteCode]);

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons name="happy-outline" size={36} color={colors.accent_rose} />
          <Text style={[styles.title, { color: colors.text_primary }]}>Partner Prompts</Text>
          <Text style={[styles.subtitle, { color: colors.text_secondary }]}>
            Send a prompt to someone you love and compare reflections.
          </Text>
        </View>

        {!isPaired && (
          <View style={[styles.guideStrip, { backgroundColor: `${colors.accent_violet}12`, borderColor: `${colors.accent_violet}40` }]}>
            <View style={styles.guideStep}>
              <View style={[styles.stepDot, { backgroundColor: colors.accent_violet }]}><Text style={styles.stepDotText}>1</Text></View>
              <Text style={[styles.stepLabel, { color: colors.text_secondary }]}>Start</Text>
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

        {!account && isAuthLoading && (
          <GlassCard style={styles.card}>
            <Ionicons name="hourglass-outline" size={28} color={colors.accent_violet} />
            <Text style={[styles.cardTitle, { color: colors.text_primary }]}>Preparing your identity...</Text>
            <Text style={[styles.cardBody, { color: colors.text_secondary }]}>
              Setting up Partner Mode on this device. This only takes a moment.
            </Text>
          </GlassCard>
        )}

        {account && !isPaired && (
          <GlassCard style={styles.card}>
            <View style={[styles.segmented, { backgroundColor: colors.glass_fill, borderColor: colors.glass_border }]}>
              {(['create', 'enter'] as PairTab[]).map((tab) => {
                const active = activeTab === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => {
                      setActiveTab(tab);
                      void Haptics.selectionAsync();
                    }}
                    style={[
                      styles.segment,
                      active && { backgroundColor: `${colors.accent_rose}22`, borderColor: `${colors.accent_rose}66` },
                    ]}
                  >
                    <Ionicons
                      name={tab === 'create' ? 'add-circle-outline' : 'keypad-outline'}
                      size={18}
                      color={active ? colors.accent_rose : colors.text_secondary}
                    />
                    <Text style={[styles.segmentText, { color: active ? colors.text_primary : colors.text_secondary }]}>
                      {tab === 'create' ? 'Create code' : 'Enter code'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {activeTab === 'create' ? (
              <>
                <Text style={[styles.cardTitle, { color: colors.text_primary }]}>Create a pair code</Text>
                <Text style={[styles.cardBody, { color: colors.text_secondary }]}>
                  Generate a code and share it with your partner.
                </Text>
                {link?.inviteCode ? (
                  <>
                    <View style={[styles.codeBlock, { borderColor: colors.accent_gold, backgroundColor: `${colors.accent_gold}10` }]}>
                      {codeChars.map((ch, i) => (
                        <View key={i} style={[styles.codeChar, { borderColor: colors.glass_border, backgroundColor: colors.glass_fill }]}>
                          <Text style={[styles.codeCharText, { color: colors.text_primary }]}>{ch}</Text>
                        </View>
                      ))}
                    </View>
                  <View style={styles.rowActions}>
                    <GhostButton label="Copy" onPress={handleCopyInvite} small style={styles.inviteActionBtn} />
                    <GradientButton label="Share" onPress={handleShareInvite} small noTopMargin style={styles.inviteActionBtn} />
                  </View>
                  <GhostButton label="Generate new code" onPress={handleRegenerateInvite} />
                </>
                ) : (
                  <GradientButton
                    label={isCreatingInvite ? 'Creating...' : 'Create pair code'}
                    onPress={handleCreateInvite}
                    disabled={isCreatingInvite}
                  />
                )}
              </>
            ) : (
              <>
                <Text style={[styles.cardTitle, { color: colors.text_primary }]}>Enter their code</Text>
                <Text style={[styles.cardBody, { color: colors.text_secondary }]}>
                  Paste the 6-character code shared by your partner.
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
              </>
            )}
          </GlassCard>
        )}

        {account && isPaired && link && (
          <>
            <GlassCard style={styles.card}>
              <View style={styles.pairedBadge}>
                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                <Text style={[styles.pairedLabel, { color: colors.success }]}>Live pair</Text>
              </View>
              <View style={styles.coupleRow}>
                <LinearGradient
                  colors={[colors.accent_rose, colors.accent_violet]}
                  style={styles.avatar}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarInitial}>
                    {myDisplayName.charAt(0).toUpperCase()}
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
                    {partnerDisplayName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>
              <Text style={[styles.coupleName, { color: colors.text_primary }]}>
                {myDisplayName} & {partnerDisplayName}
              </Text>
              <Text style={[styles.cardBody, { color: colors.text_secondary, textAlign: 'center' }]}>
                Pair code {link.partnerCode} - connected {new Date(link.pairedAt!).toLocaleDateString()}
              </Text>
            </GlassCard>

            <View style={styles.dashboardGrid}>
              <View style={[styles.metricPanel, { backgroundColor: colors.glass_fill, borderColor: colors.glass_border }]}>
                <Ionicons name="chatbubbles-outline" size={20} color={colors.accent_rose} />
                <Text style={[styles.metricValue, { color: colors.text_primary }]}>
                  {myResponse ? 'Shared' : 'Not shared'}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.text_muted }]}>Your turn</Text>
              </View>
              <View style={[styles.metricPanel, { backgroundColor: colors.glass_fill, borderColor: colors.glass_border }]}>
                <Ionicons name="heart-circle" size={20} color={colors.accent_gold} />
                <Text style={[styles.metricValue, { color: colors.text_primary }]}>
                  {partnerResponse ? 'Replied' : 'No reply'}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.text_muted }]}>Partner</Text>
              </View>
            </View>

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
              <View style={styles.scoreHeader}>
                <Ionicons name="sparkles-outline" size={22} color={colors.accent_rose} />
                <Text style={[styles.cardTitle, { color: colors.text_primary }]}>Today&apos;s exchange</Text>
              </View>
              <Text style={[styles.promptText, { color: colors.text_primary }]}>
                &quot;{activePromptText}&quot;
              </Text>
              <TextInput
                value={reflectionText}
                onChangeText={setReflectionText}
                placeholder="Write your reflection here..."
                placeholderTextColor={colors.text_muted}
                multiline
                textAlignVertical="top"
                style={[
                  styles.reflectionInput,
                  { backgroundColor: colors.glass_fill, borderColor: colors.glass_border, color: colors.text_primary },
                ]}
              />
              <GradientButton
                label={isSavingReflection ? 'Sharing...' : myResponse ? 'Update reflection' : 'Share in Partner Mode'}
                onPress={handleSaveReflection}
                disabled={isSavingReflection || reflectionText.trim().length === 0}
              />

              <View style={styles.exchangeColumns}>
                <Text style={[styles.exchangeStatus, { color: colors.text_muted }]}>
                  {responseKeys.length}/2 reflections loaded
                </Text>
                <View style={[styles.exchangePanel, { borderColor: colors.glass_border, backgroundColor: `${colors.accent_rose}0F` }]}>
                  <Text style={[styles.exchangeLabel, { color: colors.accent_rose }]}>You</Text>
                  <Text style={[styles.exchangeText, { color: myResponse ? colors.text_primary : colors.text_muted }]}>
                    {myResponse || 'Write and share your reflection above.'}
                  </Text>
                </View>
                <View style={[styles.exchangePanel, { borderColor: colors.glass_border, backgroundColor: `${colors.accent_violet}0F` }]}>
                  <Text style={[styles.exchangeLabel, { color: colors.accent_violet }]}>Partner</Text>
                  <Text style={[styles.exchangeText, { color: partnerResponse ? colors.text_primary : colors.text_muted }]}>
                    {partnerResponse || 'No partner reflection shared yet.'}
                  </Text>
                </View>
              </View>

              <GhostButton label="Copy prompt externally" onPress={handleSharePrompt} />
              <GhostButton label="Browse more prompts" onPress={() => router.push('/(tabs)/daily' as any)} />
            </GlassCard>

            {shares.length > 0 && (
              <GlassCard style={styles.card}>
                <View style={styles.scoreHeader}>
                  <Ionicons name="gift-outline" size={22} color={colors.accent_gold} />
                  <Text style={[styles.cardTitle, { color: colors.text_primary }]}>Shared with you</Text>
                </View>
                {shares.map((s) => {
                  const mine = account && s.senderUid === account.accountId;
                  return (
                    <View
                      key={s.id}
                      style={[
                        styles.sharedItem,
                        { borderColor: colors.glass_border, backgroundColor: `${mine ? colors.accent_rose : colors.accent_violet}0F` },
                      ]}
                    >
                      <View style={styles.sharedHeader}>
                        <Ionicons
                          name={s.kind === 'creation' ? 'create-outline' : 'analytics-outline'}
                          size={16}
                          color={mine ? colors.accent_rose : colors.accent_violet}
                        />
                        <Text style={[styles.sharedFrom, { color: colors.text_muted }]} numberOfLines={1}>
                          {mine ? 'You shared' : `${s.senderName ?? 'Partner'} shared`}
                        </Text>
                        {typeof s.score === 'number' && (
                          <Text style={[styles.sharedScore, { color: colors.accent_gold }]}>{s.score}%</Text>
                        )}
                      </View>
                      <Text style={[styles.sharedTitle, { color: colors.text_primary }]}>{s.title}</Text>
                      <Text style={[styles.sharedBody, { color: colors.text_secondary }]} numberOfLines={6}>
                        {s.body}
                      </Text>
                    </View>
                  );
                })}
              </GlassCard>
            )}

            <GhostButton label="Disconnect partner" onPress={handleDisconnect} style={styles.disconnect} />
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  header: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  title: { fontSize: fontSizes['2xl'], fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: fontSizes.sm, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  card: { padding: spacing.xl, gap: spacing.md, marginBottom: spacing.lg },
  cardTitle: { fontSize: fontSizes.lg, fontWeight: '600' },
  cardBody: { fontSize: fontSizes.sm, lineHeight: 20 },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
    marginBottom: spacing.sm,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  segmentText: { fontSize: fontSizes.sm, fontWeight: '700' },
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
  rowActions: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', marginTop: spacing.md },
  inviteActionBtn: { flex: 1, marginTop: 0 },
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
  sharedItem: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sharedHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sharedFrom: { flex: 1, fontSize: fontSizes.xs, letterSpacing: 1, textTransform: 'uppercase' as const, fontWeight: '600' },
  sharedScore: { fontSize: fontSizes.sm, fontWeight: '700' },
  sharedTitle: { fontSize: fontSizes.base, fontWeight: '600' },
  sharedBody: { fontSize: fontSizes.sm, lineHeight: 20 },
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
  dashboardGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricPanel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  metricValue: { fontSize: fontSizes.md, fontWeight: '800' },
  metricLabel: { fontSize: fontSizes.xs, fontWeight: '600' },
  reflectionInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSizes.base,
    lineHeight: 22,
  },
  exchangeColumns: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  exchangePanel: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  exchangeLabel: { fontSize: fontSizes.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  exchangeText: { fontSize: fontSizes.sm, lineHeight: 20 },
  exchangeStatus: { fontSize: fontSizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
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
