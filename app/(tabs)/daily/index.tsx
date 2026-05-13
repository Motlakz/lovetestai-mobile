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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
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
  });
}

export default function DailyScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    profile, streakData, todayPromptIndex, saveJournalEntry,
    savePrompt, savedPrompts, deleteSavedPrompt,
    journalEntries, deleteJournalEntry,
  } = useApp();
  const toast = useToast();
  const { confirm } = useAppAlert();

  const [activeTab, setActiveTab] = useState<DailyTab>('today');
  const [showJournal, setShowJournal] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [detailPrompt, setDetailPrompt] = useState<PromptDetail | null>(null);
  const [detailJournal, setDetailJournal] = useState('');
  const [detailReflecting, setDetailReflecting] = useState(false);
  const [platformPrompts, setPlatformPrompts] = useState<PlatformPrompt[] | null>(null);
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
    if (alreadySaved) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    savePrompt({ id: Date.now().toString(), text: todayPrompt.text, savedAt: new Date().toISOString() });
  }, [todayPrompt, savePrompt, savedPrompts]);

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
    if (already) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    savePrompt({ id: Date.now().toString(), text: detailPrompt.text, savedAt: new Date().toISOString() });
  }, [detailPrompt, savedPrompts, savePrompt]);

  const handleDetailShare = useCallback(async () => {
    if (!detailPrompt) return;
    try {
      await Share.share({ message: `"${detailPrompt.text}"\n\n— Love Test AI` });
    } catch {
      /* user dismissed */
    }
  }, [detailPrompt]);

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
  }, [deleteSavedPrompt, confirm]);

  const handleDeleteJournalEntry = useCallback(async (id: string) => {
    const ok = await confirm('Delete this journal entry?');
    if (!ok) return;
    deleteJournalEntry(id);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [deleteJournalEntry, confirm]);

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
            <GlassCard key={entry.id} style={styles.journalEntryCard}>
              <View style={styles.journalEntryHeader}>
                <Text style={styles.journalEntryDate}>{formatRelativeDate(entry.date)}</Text>
                <TouchableOpacity onPress={() => handleDeleteJournalEntry(entry.id)} style={styles.journalEntryDelete}>
                  <Ionicons name="trash-outline" size={16} color={colors.text_muted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.journalEntryPrompt} numberOfLines={1}>{entry.promptText}</Text>
              <Text style={styles.journalEntryText} numberOfLines={4}>{entry.entry}</Text>
            </GlassCard>
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
    <View style={styles.emptyState}>
      <Ionicons name="happy-outline" size={40} color={colors.accent_rose} />
      <Text style={styles.emptyTitle}>Partner Prompts</Text>
      <Text style={styles.emptyText}>
        Pair with someone to swap daily prompts and compare reflections. Mutual responses unlock once both of you sign in.
      </Text>
      <GhostButton label="Learn More" onPress={() => { void Haptics.selectionAsync(); /* TODO: route to partner tab once auth/invite ready */ }} />
    </View>
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
                      </>
                    )}
                  </View>
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </ScreenBackground>
  );
}
