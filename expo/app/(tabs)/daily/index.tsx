import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
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
import LockedOverlay from '@/components/ui/LockedOverlay';
import { useApp } from '@/context/AppContext';
import { DAILY_PROMPTS, PROMPT_CATEGORIES } from '@/mocks/tests';

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
    pastPromptsRow: { marginBottom: spacing.lg },
    pastPromptCard: { padding: spacing.lg, width: 200, marginRight: spacing.md },
    pastPromptText: { fontSize: fontSizes.sm, color: c.text_secondary, lineHeight: 20, marginBottom: spacing.sm },
    pastPromptDate: { fontSize: fontSizes.xs, color: c.text_muted, letterSpacing: 1 },
    categoryRow: { marginBottom: spacing.xl },
    categoryChip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.full, borderWidth: 1, borderColor: c.glass_border, backgroundColor: c.glass_fill, marginRight: spacing.sm },
    categoryChipSelected: { borderColor: c.accent_rose, backgroundColor: 'rgba(255,61,127,0.12)' },
    categoryText: { fontSize: fontSizes.sm, color: c.text_muted },
    categoryTextSelected: { color: c.text_primary, fontWeight: '500' as const },
    partnerSection: { marginBottom: spacing.xl },
    partnerCard: { padding: spacing.xl, minHeight: 160, position: 'relative' as const, overflow: 'hidden' as const },
    partnerCardTitle: { fontSize: fontSizes.md, color: c.text_primary, fontWeight: '500' as const, marginBottom: spacing.sm },
    partnerCardSub: { fontSize: fontSizes.sm, color: c.text_secondary },
    savedPromptsSection: { marginBottom: spacing.lg },
    savedPromptCard: { padding: spacing.lg, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md, marginBottom: spacing.sm },
    savedPromptText: { flex: 1, fontSize: fontSizes.sm, color: c.text_secondary, lineHeight: 18 },
    savedPromptDate: { fontSize: fontSizes.xs, color: c.text_muted },
    savedPromptDelete: { padding: spacing.xs },
    emptyText: { fontSize: fontSizes.sm, color: c.text_muted, fontStyle: 'italic' as const, textAlign: 'center' as const, paddingVertical: spacing.lg },
    journalEntriesSection: { marginBottom: spacing.lg },
    journalEntryCard: { padding: spacing.lg, marginBottom: spacing.sm },
    journalEntryHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: spacing.sm },
    journalEntryPrompt: { fontSize: fontSizes.xs, color: c.text_muted, fontStyle: 'italic' as const, marginBottom: spacing.sm, lineHeight: 16 },
    journalEntryText: { fontSize: fontSizes.sm, color: c.text_secondary, lineHeight: 20 },
    journalEntryDate: { fontSize: fontSizes.xs, color: c.text_muted },
    journalEntryDelete: { padding: spacing.xs },
    showMoreBtn: { alignSelf: 'center' as const, marginTop: spacing.sm },
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
    journalEntries, deleteJournalEntry, hasCouples, openPaywall, restorePurchases,
  } = useApp();
  const [showJournal, setShowJournal] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [showAllSavedPrompts, setShowAllSavedPrompts] = useState(false);
  const journalHeight = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const todayPrompt = DAILY_PROMPTS[todayPromptIndex] || DAILY_PROMPTS[0];

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const toggleJournal = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (showJournal) {
      Animated.timing(journalHeight, { toValue: 0, duration: 300, useNativeDriver: false }).start(() => setShowJournal(false));
    } else {
      setShowJournal(true);
      Animated.spring(journalHeight, { toValue: 280, useNativeDriver: false, damping: 15 }).start();
    }
  }, [showJournal, journalHeight]);

  const handleSaveEntry = useCallback(() => {
    if (!journalText.trim()) { Alert.alert('Empty entry', 'Write something before saving.'); return; }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveJournalEntry({ id: Date.now().toString(), promptText: todayPrompt.text, entry: journalText, date: new Date().toISOString() });
    setJournalText('');
    setShowJournal(false);
    journalHeight.setValue(0);
    Alert.alert('Saved', 'Your reflection has been saved. Keep the streak going!');
  }, [journalText, todayPrompt, saveJournalEntry, journalHeight]);

  const handleSavePrompt = useCallback(() => {
    const alreadySaved = savedPrompts.some(p => p.text === todayPrompt.text);
    if (alreadySaved) {
      Alert.alert('Already Saved', 'This prompt is already in your saved prompts.');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    savePrompt({ id: Date.now().toString(), text: todayPrompt.text, savedAt: new Date().toISOString() });
    Alert.alert('Saved', 'Prompt saved to your collection.');
  }, [todayPrompt, savePrompt, savedPrompts]);

  const handleDeleteSavedPrompt = useCallback((id: string) => {
    Alert.alert('Remove Prompt', 'Remove this saved prompt?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { deleteSavedPrompt(id); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } },
    ]);
  }, [deleteSavedPrompt]);

  const handleDeleteJournalEntry = useCallback((id: string) => {
    Alert.alert('Delete Entry', 'Delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteJournalEntry(id); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } },
    ]);
  }, [deleteJournalEntry]);

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

  const filteredPastPrompts = useMemo(() => {
    const allPast = DAILY_PROMPTS.filter((_, i) => i !== todayPromptIndex);
    if (selectedCategory === 'All') return allPast.slice(0, 10);
    return allPast.filter(p => p.category === selectedCategory).slice(0, 10);
  }, [todayPromptIndex, selectedCategory]);

  const displayedEntries = useMemo(() => {
    return showAllEntries ? journalEntries : journalEntries.slice(0, 3);
  }, [journalEntries, showAllEntries]);

  const displayedSavedPrompts = useMemo(() => {
    return showAllSavedPrompts ? savedPrompts : savedPrompts.slice(0, 5);
  }, [savedPrompts, showAllSavedPrompts]);

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
            <GlassCard style={styles.streakCard}>
              <Ionicons name="flame" size={28} color={colors.accent_gold} />
              <View style={styles.streakCenter}>
                <Text style={styles.streakNumber}>{streakData.streak}</Text>
                <Text style={styles.streakLabel}>{streakData.streak === 0 ? 'Start your streak today' : 'day streak'}</Text>
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
                <GhostButton label="Save Prompt" onPress={handleSavePrompt} />
              </View>
              {showJournal && (
                <Animated.View style={[styles.journalPanel, { maxHeight: journalHeight }]}>
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
                  <GhostButton label="Save Entry" onPress={handleSaveEntry} />
                </Animated.View>
              )}
            </GlassCard>

            {journalEntries.length > 0 && (
              <>
                <SectionTitle title="My Reflections" style={styles.sectionTitle} />
                <View style={styles.journalEntriesSection}>
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
                </View>
              </>
            )}

            <SectionTitle title="Browse Prompts" style={styles.sectionTitle} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
              {PROMPT_CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} onPress={() => { setSelectedCategory(cat); void Haptics.selectionAsync(); }} style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipSelected]}>
                  <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextSelected]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pastPromptsRow}>
              {filteredPastPrompts.length > 0 ? (
                filteredPastPrompts.map((prompt, i) => (
                  <GlassCard key={i} style={styles.pastPromptCard}>
                    <Text style={styles.pastPromptText} numberOfLines={3}>{prompt.text}</Text>
                    <Text style={styles.pastPromptDate}>{prompt.category}</Text>
                  </GlassCard>
                ))
              ) : (
                <Text style={styles.emptyText}>No prompts in this category</Text>
              )}
            </ScrollView>

            {savedPrompts.length > 0 && (
              <>
                <SectionTitle title="Saved Prompts" style={styles.sectionTitle} />
                <View style={styles.savedPromptsSection}>
                  {displayedSavedPrompts.map((prompt) => (
                    <GlassCard key={prompt.id} style={styles.savedPromptCard}>
                      <Ionicons name="bookmark" size={16} color={colors.accent_gold} />
                      <Text style={styles.savedPromptText} numberOfLines={2}>{prompt.text}</Text>
                      <TouchableOpacity onPress={() => handleDeleteSavedPrompt(prompt.id)} style={styles.savedPromptDelete}>
                        <Ionicons name="close-circle-outline" size={18} color={colors.text_muted} />
                      </TouchableOpacity>
                    </GlassCard>
                  ))}
                  {savedPrompts.length > 5 && (
                    <GhostButton
                      label={showAllSavedPrompts ? 'Show Less' : `Show All (${savedPrompts.length})`}
                      onPress={() => setShowAllSavedPrompts(!showAllSavedPrompts)}
                      style={styles.showMoreBtn}
                    />
                  )}
                </View>
              </>
            )}

            <SectionTitle title="Partner Prompts" style={styles.sectionTitle} />
            <View style={styles.partnerSection}>
              <GlassCard style={styles.partnerCard}>
                <Text style={styles.partnerCardTitle}>Send today{"'"}s prompt to your partner</Text>
                <Text style={styles.partnerCardSub}>Both answer privately, then see each other{"'"}s responses</Text>
                {!hasCouples && <LockedOverlay title="Partner Prompts · Couples Plan" subtitle="$14.99/mo or Lifetime $79.99" ctaLabel="See Plans" onUpgrade={() => openPaywall('couples')} onRestore={restorePurchases} compact />}
              </GlassCard>
            </View>
            <View style={styles.bottomSpacer} />
          </Animated.View>
        </ScrollView>
      </View>
    </ScreenBackground>
  );
}
