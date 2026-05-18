import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  Pressable,
  Share,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColors, fontSizes, spacing, radius } from '@/constants/theme';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import GhostButton from '@/components/ui/GhostButton';
import GoldBadge from '@/components/ui/GoldBadge';
import GoldDivider from '@/components/ui/GoldDivider';
import SectionTitle from '@/components/ui/SectionTitle';
import HeartParticles from '@/components/ui/HeartParticles';
import { useApp } from '@/context/AppContext';
import { DAILY_PROMPTS, PROMPT_CATEGORIES } from '@/mocks/tests';
import { useToast } from '@/components/ui/Toast';
import { useAppAlert } from '@/components/ui/AppAlertModal';
import { fetchPrompts, type PlatformPrompt } from '@/services/aiService';
import { useAuthStore } from '@/store/authStore';
import { usePartnerStore } from '@/store/partnerStore';
import { sharePartnerPrompt, todayExchangeKey } from '@/services/partnerExchange';
import * as Clipboard from 'expo-clipboard';
import type { JournalEntry } from '@/services/db';

type DailyTab = 'today' | 'browse' | 'saved' | 'partner';

interface PromptDetail {
  text: string;
  category: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const now = new Date();
  return `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]}`;
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
    greetingSection: { paddingVertical: spacing.lg },
    greeting: { fontSize: fontSizes.md, color: c.text_secondary, fontWeight: '500' as const },
    dateText: { fontSize: fontSizes.sm, color: c.text_muted, letterSpacing: 1.5, textTransform: 'uppercase' as const, marginTop: spacing.xs },
    tabBar: { flexDirection: 'row' as const, gap: spacing.xs, marginBottom: spacing.lg, backgroundColor: c.glass_fill, borderWidth: 1, borderColor: c.glass_border, borderRadius: radius.full, padding: spacing.xs },
    tab: { flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, borderRadius: radius.full, alignItems: 'center' as const, justifyContent: 'center' as const },
    tabActive: { backgroundColor: c.accent_rose },
    tabText: { fontSize: fontSizes.xs, color: c.text_muted, fontWeight: '500' as const },
    tabTextActive: { color: '#FFFFFF', fontWeight: '600' as const },
    streakCard: { padding: spacing.lg, flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: spacing.xl, gap: spacing.lg },
    streakCenter: { flex: 1 },
    streakNumber: { fontSize: fontSizes['2xl'], color: c.text_gold, fontWeight: '700' as const },
    streakLabel: { fontSize: fontSizes.sm, color: c.text_secondary },
    streakDots: { flexDirection: 'row' as const, gap: spacing.xs },
    streakDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.glass_fill, borderWidth: 1, borderColor: c.glass_border },
    streakDotFilled: { backgroundColor: c.accent_rose, borderColor: c.accent_rose },
    promptCard: { padding: spacing.xl, marginBottom: spacing.xl },
    promptText: { fontSize: fontSizes.xl, color: c.text_primary, fontWeight: '700' as const, fontStyle: 'italic' as const, textAlign: 'center' as const, lineHeight: 32, marginBottom: spacing.md },
    promptMeta: { fontSize: fontSizes.xs, color: c.text_muted, textAlign: 'center' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: spacing.lg },
    promptActions: { gap: spacing.md, alignItems: 'center' as const },
    journalPanel: { marginTop: spacing.lg },
    journalInput: { backgroundColor: c.glass_fill, borderWidth: 1, borderColor: c.glass_border, borderRadius: radius.md, padding: spacing.lg, color: c.text_primary, fontSize: fontSizes.base, minHeight: 120, textAlignVertical: 'top' as const, marginBottom: spacing.md },
    journalCharCount: { fontSize: fontSizes.xs, color: c.text_muted, textAlign: 'right' as const, marginBottom: spacing.sm },
    sectionTitle: { marginTop: spacing.md },
    browseList: { gap: spacing.sm },
    categoryRow: { marginBottom: spacing.lg },
    categoryChip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.full, borderWidth: 1, borderColor: c.glass_border, backgroundColor: c.glass_fill, marginRight: spacing.sm },
    categoryChipSelected: { borderColor: c.accent_rose, backgroundColor: 'rgba(255,61,127,0.12)' },
    categoryText: { fontSize: fontSizes.sm, color: c.text_muted },
    categoryTextSelected: { color: c.text_primary, fontWeight: '500' as const },
    promptListItem: { padding: spacing.lg, marginBottom: spacing.sm, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md },
    promptListText: { flex: 1, fontSize: fontSizes.sm, color: c.text_secondary, lineHeight: 20 },
    promptListCategory: { fontSize: fontSizes.xs, color: c.accent_rose, letterSpacing: 1, textTransform: 'uppercase' as const, marginTop: spacing.xs },
    savedPromptCard: { padding: spacing.lg, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md, marginBottom: spacing.sm },
    savedPromptText: { flex: 1, fontSize: fontSizes.sm, color: c.text_secondary, lineHeight: 18 },
    savedPromptDelete: { padding: spacing.xs },
    emptyState: { paddingVertical: spacing['3xl'], alignItems: 'center' as const, gap: spacing.md },
    emptyTitle: { fontSize: fontSizes.lg, color: c.text_primary, fontWeight: '600' as const, textAlign: 'center' as const },
    emptyText: { fontSize: fontSizes.sm, color: c.text_muted, textAlign: 'center' as const, paddingHorizontal: spacing.xl, lineHeight: 20 },
    journalEntryCard: { padding: spacing.lg, marginBottom: spacing.sm },
    journalEntryHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: spacing.sm },
    journalEntryPrompt: { fontSize: fontSizes.xs, color: c.text_muted, fontStyle: 'italic' as const, marginBottom: spacing.sm, lineHeight: 16 },
    journalEntryText: { fontSize: fontSizes.sm, color: c.text_secondary, lineHeight: 20 },
    journalEntryDate: { fontSize: fontSizes.xs, color: c.text_muted },
    journalEntryDelete: { padding: spacing.xs },
    showMoreBtn: { alignSelf: 'center' as const, marginTop: spacing.sm },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' as const },
    modalSheet: { backgroundColor: c.bg_deep, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md, maxHeight: '85%' as const, borderWidth: 1, borderColor: c.glass_border },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.text_muted, alignSelf: 'center' as const, marginBottom: spacing.sm, opacity: 0.4 },
    modalCategory: { fontSize: fontSizes.xs, color: c.accent_rose, letterSpacing: 1.5, textTransform: 'uppercase' as const, textAlign: 'center' as const },
    modalPrompt: { fontSize: fontSizes.xl, color: c.text_primary, fontWeight: '700' as const, fontStyle: 'italic' as const, textAlign: 'center' as const, lineHeight: 32, marginVertical: spacing.md },
    modalActions: { gap: spacing.sm, marginTop: spacing.md },
    reflectionsSection: { marginTop: spacing.sm, marginBottom: spacing.md, gap: spacing.sm },
    reflectionsHeader: { fontSize: fontSizes.xs, color: c.text_muted, letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: spacing.xs },
    reflectionItem: {
      backgroundColor: c.glass_fill,
      borderWidth: 1,
      borderColor: c.glass_border,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: 4,
    },
    reflectionDate: { fontSize: fontSizes.xs, color: c.text_muted },
    reflectionText: { fontSize: fontSizes.sm, color: c.text_secondary, lineHeight: 20 },
    bottomSpacer: { height: 40 },
    detailCenterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' as const, alignItems: 'center' as const, padding: spacing.xl },
    detailModalCard: {
      width: '100%' as const,
      maxWidth: 460,
      maxHeight: '90%' as const,
      backgroundColor: c.bg_surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.glass_border,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xl,
    },
    detailClose: { position: 'absolute' as const, top: spacing.md, right: spacing.md, zIndex: 10 },
    detailEyebrow: { color: c.accent_rose, fontSize: fontSizes.xs, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: spacing.xs, paddingRight: spacing.xl },
    detailPromptText: { color: c.text_primary, fontSize: fontSizes.md, fontStyle: 'italic' as const, fontWeight: '600' as const, lineHeight: 26, marginBottom: spacing.sm, paddingRight: spacing.xl },
    detailDateText: { color: c.text_muted, fontSize: fontSizes.xs, marginBottom: spacing.md },
    detailScrollBox: {
      maxHeight: 320,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.glass_border,
      backgroundColor: c.glass_fill,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    detailBody: { color: c.text_primary, fontSize: fontSizes.base, lineHeight: 24 },
    detailEditInput: {
      height: 150,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.accent_rose,
      backgroundColor: c.glass_fill,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      color: c.text_primary,
      fontSize: fontSizes.base,
      lineHeight: 24,
      textAlignVertical: 'top' as const,
    },
    detailActions: { flexDirection: 'row' as const, gap: spacing.sm, justifyContent: 'center' as const, alignItems: 'center' as const, flexWrap: 'wrap' as const },
    detailActionBtn: {
      width: 48,
      height: 48,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.glass_border,
      backgroundColor: c.glass_fill,
    },
    detailActionBtnText: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: c.glass_border,
      backgroundColor: c.glass_fill,
      minWidth: 100,
    },
    detailActionBtnTextPrimary: { borderColor: c.accent_rose, backgroundColor: 'rgba(255,61,127,0.14)' },
    detailActionBtnLabel: { fontSize: fontSizes.sm, fontWeight: '600' as const, color: c.text_primary },
    detailActionBtnLabelPrimary: { color: c.accent_rose },
    detailActionPrimary: { borderColor: c.accent_rose, backgroundColor: 'rgba(255,61,127,0.14)' },
    detailActionDanger: { borderColor: `${c.error}55`, backgroundColor: `${c.error}14` },
  });
}

export default function DailyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    profile, streakData, todayPromptIndex, saveJournalEntry,
    savePrompt, savedPrompts, deleteSavedPrompt,
    journalEntries, deleteJournalEntry, updateJournalEntry,
  } = useApp();
  const toast = useToast();
  const { confirm } = useAppAlert();
  const account = useAuthStore((s) => s.account);
  const partnerLink = usePartnerStore((s) => s.link);

  const [activeTab, setActiveTab] = useState<DailyTab>('today');
  const [showJournal, setShowJournal] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [detailPrompt, setDetailPrompt] = useState<PromptDetail | null>(null);
  const [detailJournal, setDetailJournal] = useState('');
  const [detailReflecting, setDetailReflecting] = useState(false);
  const [platformPrompts, setPlatformPrompts] = useState<PlatformPrompt[] | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editingEntryText, setEditingEntryText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const promptSource = platformPrompts && platformPrompts.length > 0 ? platformPrompts : DAILY_PROMPTS;
  const todayPrompt = promptSource[todayPromptIndex % promptSource.length] || promptSource[0] || DAILY_PROMPTS[0];

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeAnim]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const prompts = await fetchPrompts('All', 100);
      if (mounted && prompts?.length) setPlatformPrompts(prompts);
    })();
    return () => { mounted = false; };
  }, []);

  const last7Days = useCallback(() => {
    const days: boolean[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      days.push(streakData.completedDays.includes(dateStr));
    }
    return days;
  }, [streakData.completedDays]);

  const toggleJournal = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowJournal(prev => !prev);
  }, []);

  const handleSaveTodayEntry = useCallback(() => {
    if (!journalText.trim()) { toast.warning('Write something before saving.'); return; }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveJournalEntry({ id: Date.now().toString(), promptText: todayPrompt.text, entry: journalText, date: new Date().toISOString() });
    setJournalText('');
    setShowJournal(false);
    toast.success('Entry saved.');
  }, [journalText, todayPrompt, saveJournalEntry, toast]);

  const handleSaveTodayPrompt = useCallback(() => {
    const alreadySaved = savedPrompts.some(p => p.text === todayPrompt.text);
    if (alreadySaved) { toast.info('Already in your saved prompts.'); return; }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    savePrompt({ id: Date.now().toString(), text: todayPrompt.text, savedAt: new Date().toISOString() });
    toast.success('Prompt saved.');
  }, [todayPrompt, savePrompt, savedPrompts, toast]);

  const openPromptDetail = useCallback((p: PromptDetail) => {
    void Haptics.selectionAsync();
    setDetailPrompt(p);
    setDetailJournal('');
    setDetailReflecting(false);
  }, []);

  const closePromptDetail = useCallback(() => {
    setDetailPrompt(null);
    setDetailJournal('');
    setDetailReflecting(false);
  }, []);

  const handleDetailSave = useCallback(() => {
    if (!detailPrompt) return;
    const already = savedPrompts.some(p => p.text === detailPrompt.text);
    if (already) { toast.info('Already in your saved prompts.'); return; }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    savePrompt({ id: Date.now().toString(), text: detailPrompt.text, savedAt: new Date().toISOString() });
    toast.success('Prompt saved.');
  }, [detailPrompt, savedPrompts, savePrompt, toast]);

  const handleDetailShare = useCallback(async () => {
    if (!detailPrompt) return;
    try {
      await Share.share({ message: `"${detailPrompt.text}"\n\n— Love Test AI` });
    } catch {
      /* user dismissed */
    }
  }, [detailPrompt]);

  const handleSharePartnerPrompt = useCallback(async (prompt: PromptDetail) => {
    if (!account || !partnerLink?.pairId) {
      toast.warning('Pair with someone before sharing partner prompts.');
      router.push('/(tabs)/partner' as any);
      return;
    }

    try {
      await sharePartnerPrompt({
        pairId: partnerLink.pairId,
        exchangeId: todayExchangeKey(),
        promptText: prompt.text,
        promptCategory: prompt.category,
        account,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Prompt shared to Partner Mode.');
      router.push('/(tabs)/partner' as any);
    } catch (e) {
      console.log('partner prompt share failed:', e);
      toast.error('Could not share this prompt to Partner Mode.');
    }
  }, [account, partnerLink?.pairId, router, toast]);

  const handleDetailReflect = useCallback(() => {
    if (!detailPrompt) return;
    if (!detailReflecting) { setDetailReflecting(true); return; }
    if (!detailJournal.trim()) { toast.warning('Write something before saving.'); return; }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveJournalEntry({ id: Date.now().toString(), promptText: detailPrompt.text, entry: detailJournal, date: new Date().toISOString() });
    closePromptDetail();
    toast.success('Reflection saved.');
  }, [detailPrompt, detailReflecting, detailJournal, saveJournalEntry, closePromptDetail, toast]);

  const handleDeleteSavedPrompt = useCallback(async (id: string) => {
    const ok = await confirm('Remove this saved prompt?');
    if (!ok) return;
    deleteSavedPrompt(id);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.success('Prompt removed.');
  }, [deleteSavedPrompt, confirm, toast]);

  const handleDeleteJournalEntry = useCallback(async (id: string) => {
    const ok = await confirm('Delete this journal entry?');
    if (!ok) return;
    deleteJournalEntry(id);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.success('Journal entry deleted.');
  }, [deleteJournalEntry, confirm, toast]);

  const handleOpenJournalEntry = useCallback((entry: JournalEntry) => {
    void Haptics.selectionAsync();
    setViewingEntry(entry);
    setEditingEntryText(entry.entry);
    setIsEditingEntry(false);
  }, []);

  const handleCloseJournalDetail = useCallback(() => {
    setViewingEntry(null);
    setIsEditingEntry(false);
    setEditingEntryText('');
  }, []);

  const handleCopyJournalEntry = useCallback(async (entry: JournalEntry) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `${entry.promptText}\n\n${entry.entry}`;
    if (Platform.OS === 'web') {
      try { await navigator.clipboard.writeText(text); } catch { console.log('Copy failed'); }
    } else {
      await Clipboard.setStringAsync(text);
    }
    toast.success('Reflection copied.');
  }, [toast]);

  const handleShareJournalEntry = useCallback(async (entry: JournalEntry) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `Reflecting on: "${entry.promptText}"\n\n${entry.entry}`;
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: 'My Reflection', text });
        } else {
          try { await navigator.clipboard.writeText(text); } catch { console.log('Share copy failed'); }
          toast.success('Reflection copied to clipboard.');
        }
      } else {
        await Share.share({ message: text, title: 'My Reflection' });
      }
    } catch (e: any) {
      if (e?.message !== 'User did not share') console.log('Share error:', e);
    }
  }, [toast]);

  const handleSaveJournalEdit = useCallback(() => {
    if (!viewingEntry) return;
    const trimmed = editingEntryText.trim();
    if (!trimmed) {
      toast.info('Reflection cannot be empty.');
      return;
    }
    updateJournalEntry(viewingEntry.id, { entry: trimmed });
    setViewingEntry({ ...viewingEntry, entry: trimmed });
    setIsEditingEntry(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Reflection updated.');
  }, [viewingEntry, editingEntryText, updateJournalEntry, toast]);

  const handleDeleteFromDetail = useCallback(async () => {
    if (!viewingEntry) return;
    const id = viewingEntry.id;
    handleCloseJournalDetail();
    await handleDeleteJournalEntry(id);
  }, [viewingEntry, handleCloseJournalDetail, handleDeleteJournalEntry]);

  const filteredBrowsePrompts = useMemo(() => {
    const allPast = promptSource.filter((_, i) => i !== todayPromptIndex % promptSource.length);
    if (selectedCategory === 'All') return allPast;
    return allPast.filter(p => p.category === selectedCategory);
  }, [promptSource, todayPromptIndex, selectedCategory]);

  const displayedEntries = useMemo(() => {
    return showAllEntries ? journalEntries : journalEntries.slice(0, 3);
  }, [journalEntries, showAllEntries]);

  const TABS: { id: DailyTab; label: string }[] = [
    { id: 'today', label: "Today" },
    { id: 'browse', label: 'Browse' },
    { id: 'saved', label: 'Saved' },
    { id: 'partner', label: 'Partner' },
  ];

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {TABS.map((t) => (
        <TouchableOpacity
          key={t.id}
          onPress={() => { void Haptics.selectionAsync(); setActiveTab(t.id); }}
          style={[styles.tab, activeTab === t.id && styles.tabActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderToday = () => (
    <>
      <GlassCard style={styles.streakCard}>
        <Ionicons name="flame" size={28} color={colors.accent_gold} />
        <View style={styles.streakCenter}>
          <Text style={styles.streakNumber}>{streakData.streak}</Text>
          <Text style={styles.streakLabel}>{streakData.streak === 0 ? 'Start your reflection streak' : 'day reflection streak'}</Text>
        </View>
        <View style={styles.streakDots}>
          {last7Days().map((completed, i) => (
            <View key={i} style={[styles.streakDot, completed && styles.streakDotFilled]} />
          ))}
        </View>
      </GlassCard>

      <GlassCard style={styles.promptCard}>
        <GoldBadge label="TODAY'S PROMPT" />
        <GoldDivider />
        <Text style={styles.promptText}>{todayPrompt.text}</Text>
        <Text style={styles.promptMeta}>{todayPrompt.category.toUpperCase()} · 2 MIN</Text>
        <View style={styles.promptActions}>
          <GradientButton label={showJournal ? 'Close Journal' : 'Reflect on This'} onPress={toggleJournal} />
          <GhostButton label="Save Prompt" onPress={handleSaveTodayPrompt} />
        </View>
        {showJournal && (
          <View style={styles.journalPanel}>
            <GoldDivider />
            <TextInput
              value={journalText}
              onChangeText={setJournalText}
              placeholder="Write freely..."
              placeholderTextColor={colors.text_muted}
              multiline
              style={styles.journalInput}
              testID="journal-input"
              maxLength={1000}
            />
            {journalText.length > 0 && (
              <Text style={styles.journalCharCount}>{journalText.length}/1000</Text>
            )}
            <GhostButton label="Save Entry" onPress={handleSaveTodayEntry} />
          </View>
        )}
      </GlassCard>

      {journalEntries.length > 0 && (
        <>
          <SectionTitle title="My Reflections" style={styles.sectionTitle} />
          {displayedEntries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              activeOpacity={0.85}
              onPress={() => handleOpenJournalEntry(entry)}
            >
              <GlassCard style={styles.journalEntryCard}>
                <View style={styles.journalEntryHeader}>
                  <Text style={styles.journalEntryDate}>{formatRelativeDate(entry.date)}</Text>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation?.(); handleDeleteJournalEntry(entry.id); }}
                    style={styles.journalEntryDelete}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.text_muted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.journalEntryPrompt} numberOfLines={1}>{entry.promptText}</Text>
                <Text style={styles.journalEntryText} numberOfLines={4}>{entry.entry}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
          {journalEntries.length > 3 && (
            <GhostButton
              label={showAllEntries ? 'Show Less' : `Show All (${journalEntries.length})`}
              onPress={() => setShowAllEntries(!showAllEntries)}
              style={styles.showMoreBtn}
            />
          )}
        </>
      )}
    </>
  );

  const renderBrowse = () => (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        {PROMPT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => { setSelectedCategory(cat); void Haptics.selectionAsync(); }}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipSelected]}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextSelected]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.browseList}>
        {filteredBrowsePrompts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={32} color={colors.text_muted} />
            <Text style={styles.emptyText}>No prompts in this category yet.</Text>
          </View>
        ) : (
          filteredBrowsePrompts.map((prompt, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => openPromptDetail({ text: prompt.text, category: prompt.category })}
              activeOpacity={0.8}
            >
              <GlassCard style={styles.promptListItem}>
                <Ionicons name="sparkles-outline" size={20} color={colors.accent_violet} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.promptListText} numberOfLines={3}>{prompt.text}</Text>
                  <Text style={styles.promptListCategory}>{prompt.category}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </View>
    </>
  );

  const renderSaved = () => (
    savedPrompts.length === 0 ? (
      <View style={styles.emptyState}>
        <Ionicons name="bookmark-outline" size={40} color={colors.text_muted} />
        <Text style={styles.emptyTitle}>Nothing saved yet</Text>
        <Text style={styles.emptyText}>Tap save on any prompt to keep it here for later.</Text>
      </View>
    ) : (
      <FlatList
        data={savedPrompts}
        keyExtractor={(p) => p.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openPromptDetail({ text: item.text, category: 'Saved' })}
            activeOpacity={0.8}
          >
            <GlassCard style={styles.savedPromptCard}>
              <Ionicons name="bookmark" size={16} color={colors.accent_gold} />
              <Text style={styles.savedPromptText} numberOfLines={2}>{item.text}</Text>
              <TouchableOpacity onPress={() => handleDeleteSavedPrompt(item.id)} style={styles.savedPromptDelete}>
                <Ionicons name="close-circle-outline" size={18} color={colors.text_muted} />
              </TouchableOpacity>
            </GlassCard>
          </TouchableOpacity>
        )}
      />
    )
  );

  const renderPartner = () => (
    <>
      <GlassCard style={styles.promptCard}>
        <GoldBadge label="PARTNER PROMPT" />
        <GoldDivider />
        <Text style={styles.promptText}>{todayPrompt.text}</Text>
        <Text style={styles.promptMeta}>{todayPrompt.category.toUpperCase()} Â· SHARED EXCHANGE</Text>
        <View style={styles.promptActions}>
          <GradientButton
            label={partnerLink?.pairId ? 'Share prompt' : 'Pair first'}
            onPress={() => handleSharePartnerPrompt({ text: todayPrompt.text, category: todayPrompt.category })}
          />
          <GhostButton label="Open Partner Mode" onPress={() => router.push('/(tabs)/partner' as any)} />
        </View>
      </GlassCard>

      <SectionTitle title="Browse for Two" style={styles.sectionTitle} />
      <View style={styles.browseList}>
        {filteredBrowsePrompts.slice(0, 6).map((prompt, i) => (
          <GlassCard key={`${prompt.text}-${i}`} style={styles.promptListItem}>
            <Ionicons name="people-outline" size={20} color={colors.accent_violet} />
            <View style={{ flex: 1 }}>
              <Text style={styles.promptListText} numberOfLines={3}>{prompt.text}</Text>
              <Text style={styles.promptListCategory}>{prompt.category}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleSharePartnerPrompt({ text: prompt.text, category: prompt.category })}
              activeOpacity={0.75}
            >
              <Ionicons name="share-social-outline" size={22} color={colors.accent_rose} />
            </TouchableOpacity>
          </GlassCard>
        ))}
      </View>
    </>
  );

  const detailAlreadySaved = useMemo(() => {
    return detailPrompt ? savedPrompts.some(p => p.text === detailPrompt.text) : false;
  }, [detailPrompt, savedPrompts]);

  const detailReflections = useMemo(() => {
    if (!detailPrompt) return [];
    return journalEntries.filter((j) => j.promptText === detailPrompt.text);
  }, [detailPrompt, journalEntries]);

  const closeReflectMode = useCallback(() => {
    setDetailReflecting(false);
    setDetailJournal('');
  }, []);

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <HeartParticles />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>{getGreeting()}, {profile.name || 'friend'}</Text>
              <Text style={styles.dateText}>{getFormattedDate()}</Text>
            </View>

            {renderTabBar()}

            {activeTab === 'today' && renderToday()}
            {activeTab === 'browse' && renderBrowse()}
            {activeTab === 'saved' && renderSaved()}
            {activeTab === 'partner' && renderPartner()}

            <View style={styles.bottomSpacer} />
          </Animated.View>
        </ScrollView>

        <Modal
          visible={!!detailPrompt}
          animationType="slide"
          transparent
          onRequestClose={closePromptDetail}
        >
          <Pressable style={styles.modalBackdrop} onPress={closePromptDetail}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              {detailPrompt && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalCategory}>{detailPrompt.category}</Text>
                  <Text style={styles.modalPrompt}>{detailPrompt.text}</Text>

                  {!detailReflecting && detailReflections.length > 0 && (
                    <View style={styles.reflectionsSection}>
                      <Text style={styles.reflectionsHeader}>
                        Your reflections ({detailReflections.length})
                      </Text>
                      {detailReflections.map((r) => (
                        <View key={r.id} style={styles.reflectionItem}>
                          <Text style={styles.reflectionDate}>{formatRelativeDate(r.date)}</Text>
                          <Text style={styles.reflectionText}>{r.entry}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {detailReflecting && (
                    <View>
                      <TextInput
                        value={detailJournal}
                        onChangeText={setDetailJournal}
                        placeholder="Write your reflection..."
                        placeholderTextColor={colors.text_muted}
                        multiline
                        style={styles.journalInput}
                        maxLength={1000}
                      />
                      {detailJournal.length > 0 && (
                        <Text style={styles.journalCharCount}>{detailJournal.length}/1000</Text>
                      )}
                    </View>
                  )}

                  <View style={styles.modalActions}>
                    <GradientButton
                      label={detailReflecting ? 'Save Reflection' : 'Reflect on This'}
                      onPress={handleDetailReflect}
                    />
                    {detailReflecting ? (
                      <GhostButton label="Close Reflection" onPress={closeReflectMode} />
                    ) : (
                      <>
                        <GhostButton
                          label={detailAlreadySaved ? 'Already Saved' : 'Save Prompt'}
                          onPress={handleDetailSave}
                        />
                        <GhostButton label="Share" onPress={handleDetailShare} />
                        <GhostButton
                          label="Share to Partner"
                          onPress={() => {
                            if (!detailPrompt) return;
                            void handleSharePartnerPrompt(detailPrompt);
                            closePromptDetail();
                          }}
                        />
                      </>
                    )}
                  </View>
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={!!viewingEntry}
          transparent
          animationType="fade"
          onRequestClose={handleCloseJournalDetail}
        >
          <KeyboardAvoidingView
            style={styles.detailCenterOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {viewingEntry && (
              <View style={styles.detailModalCard}>
                <TouchableOpacity onPress={handleCloseJournalDetail} style={styles.detailClose} hitSlop={10}>
                  <Ionicons name="close" size={24} color={colors.text_secondary} />
                </TouchableOpacity>
                <Text style={styles.detailEyebrow}>Reflection</Text>
                <Text style={styles.detailPromptText}>{viewingEntry.promptText}</Text>
                <Text style={styles.detailDateText}>{formatRelativeDate(viewingEntry.date)}</Text>

                {isEditingEntry ? (
                  <TextInput
                    style={styles.detailEditInput}
                    value={editingEntryText}
                    onChangeText={setEditingEntryText}
                    multiline
                    autoFocus
                    placeholder="Edit your reflection…"
                    placeholderTextColor={colors.text_muted}
                  />
                ) : (
                  <ScrollView style={styles.detailScrollBox} showsVerticalScrollIndicator={false}>
                    <Text style={styles.detailBody}>{viewingEntry.entry}</Text>
                  </ScrollView>
                )}

                <View style={styles.detailActions}>
                  {isEditingEntry ? (
                    <>
                      <TouchableOpacity
                        style={[styles.detailActionBtnText, styles.detailActionBtnTextPrimary]}
                        activeOpacity={0.8}
                        onPress={handleSaveJournalEdit}
                        accessibilityLabel="Save"
                      >
                        <Ionicons name="checkmark-outline" size={18} color={colors.accent_rose} />
                        <Text style={styles.detailActionBtnLabelPrimary}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.detailActionBtnText}
                        activeOpacity={0.8}
                        onPress={() => {
                          setIsEditingEntry(false);
                          setEditingEntryText(viewingEntry.entry);
                        }}
                        accessibilityLabel="Cancel"
                      >
                        <Ionicons name="close-outline" size={18} color={colors.text_primary} />
                        <Text style={styles.detailActionBtnLabel}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.detailActionBtn}
                        activeOpacity={0.8}
                        onPress={() => { setIsEditingEntry(true); void Haptics.selectionAsync(); }}
                        accessibilityLabel="Edit"
                      >
                        <Ionicons name="create-outline" size={22} color={colors.text_primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.detailActionBtn}
                        activeOpacity={0.8}
                        onPress={() => handleCopyJournalEntry(viewingEntry)}
                        accessibilityLabel="Copy"
                      >
                        <Ionicons name="copy-outline" size={22} color={colors.text_primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.detailActionBtn}
                        activeOpacity={0.8}
                        onPress={() => handleShareJournalEntry(viewingEntry)}
                        accessibilityLabel="Share"
                      >
                        <Ionicons name="share-outline" size={22} color={colors.text_primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.detailActionBtn, styles.detailActionDanger]}
                        activeOpacity={0.8}
                        onPress={handleDeleteFromDetail}
                        accessibilityLabel="Delete"
                      >
                        <Ionicons name="trash-outline" size={22} color={colors.error} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ScreenBackground>
  );
}
