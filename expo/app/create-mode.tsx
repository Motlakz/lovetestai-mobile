import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
  Modal,
  Linking,
  Share,
  KeyboardAvoidingView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColors, ThemeShadows, fontSizes, spacing, radius } from '@/constants/theme';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import GhostButton from '@/components/ui/GhostButton';
import GoldBadge from '@/components/ui/GoldBadge';
import GoldDivider from '@/components/ui/GoldDivider';
import SectionTitle from '@/components/ui/SectionTitle';
import InputField from '@/components/ui/InputField';
import LoadingPulse from '@/components/ui/LoadingPulse';
import HeartParticles from '@/components/ui/HeartParticles';
import { useApp } from '@/context/AppContext';
import { generateContent } from '@/services/claudeApi';

const TOOL_META: Record<string, { title: string; icon: string; subtitle: string; cta: string }> = {
  'love-letter': { title: 'Love Letter', icon: 'mail-outline', subtitle: 'Write a heartfelt, deeply personal letter', cta: 'Write the Letter' },
  'love-poem': { title: 'Love Poem', icon: 'book-outline', subtitle: 'Craft a beautiful romantic poem', cta: 'Create the Poem' },
  'love-note': { title: 'Love Note', icon: 'chatbox-outline', subtitle: 'A quick, genuine love note', cta: 'Craft the Note' },
  'love-quote': { title: 'Love Quote', icon: 'text-outline', subtitle: 'Generate an original love quote', cta: 'Generate a Quote' },
  'date-ideas': { title: 'Date Ideas', icon: 'location-outline', subtitle: 'Get creative, personalised date suggestions', cta: 'Find Date Ideas' },
  'conversation-starters': { title: 'Conversation Starters', icon: 'people-outline', subtitle: 'Meaningful openers for deeper connection', cta: 'Get Starters' },
};

const TONES = ['Romantic', 'Playful', 'Sincere', 'Poetic'];
const LENGTHS = ['Short', 'Medium', 'Long'];
const OCCASIONS = ['Birthday', 'Anniversary', 'Just Because', 'First Valentine'];
const POEM_STYLES = ['Rhyming', 'Free Verse', 'Haiku', 'Sonnet'];
const VIBES = ['Cozy', 'Adventurous', 'Romantic', 'Budget-Friendly'];
const STAGES = ['New Together', 'Dating', 'Long-Term', 'Married'];

function createStyles(c: ThemeColors, _s: ThemeShadows) {
  return StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1 },
    topBar: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.glass_fill, borderWidth: 1, borderColor: c.glass_border, alignItems: 'center' as const, justifyContent: 'center' as const },
    topBarCenter: { flex: 1 },
    topBarTitle: { fontSize: fontSizes.lg, color: c.text_primary, fontWeight: '700' as const },
    topBarSub: { fontSize: fontSizes.xs, color: c.text_muted },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
    formPanel: { padding: spacing.xl, marginBottom: spacing.lg },
    fieldLabel: { color: c.text_secondary, fontSize: fontSizes.sm, fontWeight: '500' as const, marginBottom: spacing.sm, marginTop: spacing.sm },
    pillRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm, marginBottom: spacing.md },
    pill: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.full, borderWidth: 1, borderColor: c.glass_border, backgroundColor: c.glass_fill },
    pillSelected: { borderColor: c.accent_rose, backgroundColor: 'rgba(255,61,127,0.12)' },
    pillText: { color: c.text_secondary, fontSize: fontSizes.sm },
    pillTextSelected: { color: c.text_primary, fontWeight: '500' as const },
    generateBtn: { marginBottom: spacing.sm },
    disclaimer: { color: c.text_muted, fontSize: fontSizes.xs, textAlign: 'center' as const, marginBottom: spacing.xl },
    resultContainer: { marginTop: spacing.md },
    resultCard: { padding: spacing.xl },
    resultText: { color: c.text_primary, fontSize: fontSizes.base, lineHeight: 26 },
    resultActions: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm, justifyContent: 'center' as const },
    bottomSpacer: { height: 40 },
    exportOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' as const },
    exportSheet: { backgroundColor: c.bg_surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, borderColor: c.glass_border, borderBottomWidth: 0 },
    exportHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.glass_border, alignSelf: 'center' as const, marginTop: spacing.md },
    exportContent: { padding: spacing.xl, gap: spacing.lg },
    exportTitle: { fontSize: fontSizes.lg, color: c.text_primary, fontWeight: '600' as const, textAlign: 'center' as const },
    exportPreview: { backgroundColor: c.bg_elevated, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: c.glass_border, borderLeftWidth: 3, borderLeftColor: c.accent_gold, paddingLeft: spacing.lg },
    exportPreviewText: { color: c.text_primary, fontSize: fontSizes.sm, lineHeight: 22, maxHeight: 120 },
    exportWatermark: { fontSize: fontSizes.xs, color: c.text_muted, textAlign: 'right' as const, marginTop: spacing.md, fontStyle: 'italic' as const },
    exportOptionRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: spacing.lg, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: c.glass_border },
    exportOptionLabel: { flex: 1, fontSize: fontSizes.base, color: c.text_primary },
    exportLockedRow: { position: 'relative' as const, overflow: 'hidden' as const, borderRadius: radius.md },
    exportLockedInner: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: spacing.lg, paddingHorizontal: spacing.md, gap: spacing.md, opacity: 0.4 },
    exportLockedBadge: { position: 'absolute' as const, right: spacing.md, top: spacing.lg },
    exportCloseBtn: { marginTop: spacing.sm },
  });
}

export default function CreateModeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tool } = useLocalSearchParams<{ tool: string }>();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { generationsRemaining, incrementGenerations, saveCreation, profile, isPremium, canGenerate, hasPremiumExport, openPaywall, purchaseIAP } = useApp();

  const meta = TOOL_META[tool || 'love-letter'] || TOOL_META['love-letter'];

  const [toName, setToName] = useState('');
  const [fromName, setFromName] = useState(profile.name || '');
  const [tone, setTone] = useState('Romantic');
  const [length, setLength] = useState('Medium');
  const [detail, setDetail] = useState('');
  const [occasion, setOccasion] = useState('Just Because');
  const [poemStyle, setPoemStyle] = useState('Free Verse');
  const [memory, setMemory] = useState('');
  const [message, setMessage] = useState('');
  const [word, setWord] = useState('');
  const [city, setCity] = useState('');
  const [vibe, setVibe] = useState('Romantic');
  const [stage, setStage] = useState('Dating');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);

  const resultAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const selectedTool = tool || 'love-letter';

  const handleGenerate = useCallback(async () => {
    if (generationsRemaining <= 0) {
      openPaywall();
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setShowResult(false);
    resultAnim.setValue(0);
    try {
      const content = await generateContent(
        { tool: selectedTool, fromName, toName, tone, length, detail, occasion, style: poemStyle, memory, message, word, city, vibe, stage },
        profile.apiKey || undefined
      );
      setResult(content);
      incrementGenerations();
      setShowResult(true);
      Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, damping: 15 }).start();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, 300);
    } catch (error) {
      console.log('Generation error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTool, fromName, toName, tone, length, detail, occasion, poemStyle, memory, message, word, city, vibe, stage, generationsRemaining, incrementGenerations, resultAnim, profile.apiKey, openPaywall]);

  const handleCopy = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      try { await navigator.clipboard.writeText(result); } catch { console.log('Copy failed on web'); }
    } else {
      await Clipboard.setStringAsync(result);
    }
    Alert.alert('Copied', 'Content copied to clipboard');
  }, [result]);

  const handleSave = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveCreation({ id: Date.now().toString(), type: meta.title, content: result, toName, createdAt: new Date().toISOString() });
    Alert.alert('Saved', 'Your creation has been saved to your profile.');
  }, [result, meta.title, toName, saveCreation]);

  const handleRegenerate = useCallback(() => {
    setShowResult(false);
    setResult('');
    void handleGenerate();
  }, [handleGenerate]);

  const handleExportShare = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const shareText = `${meta.title}\n\n${result}\n\n-- Created with LoveTestAI`;
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: meta.title, text: shareText });
        } else {
          try { await navigator.clipboard.writeText(shareText); } catch { console.log('Share copy failed'); }
          Alert.alert('Copied', 'Text copied to clipboard.');
        }
      } else {
        await Share.share({ message: shareText, title: meta.title });
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share') console.log('Share error:', error);
    }
    setShowExportSheet(false);
  }, [result, meta.title]);

  const handleWhatsAppShare = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const shareText = `${meta.title}\n\n${result}\n\n-- Created with LoveTestAI`;
    const encoded = encodeURIComponent(shareText);
    const url = `whatsapp://send?text=${encoded}`;
    try {
      const supported = Platform.OS !== 'web' && await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else if (Platform.OS === 'web') {
        await Linking.openURL(`https://wa.me/?text=${encoded}`);
      } else {
        Alert.alert('WhatsApp not found', 'Text copied to clipboard instead.');
        await Clipboard.setStringAsync(shareText);
      }
    } catch (error) { console.log('WhatsApp share error:', error); }
    setShowExportSheet(false);
  }, [result, meta.title]);

  const handleExportCopy = useCallback(async () => {
    await handleCopy();
    setShowExportSheet(false);
  }, [handleCopy]);

  const renderPillSelector = (options: string[], selected: string, onSelect: (v: string) => void) => (
    <View style={styles.pillRow}>
      {options.map((opt) => (
        <TouchableOpacity key={opt} onPress={() => { onSelect(opt); void Haptics.selectionAsync(); }} style={[styles.pill, selected === opt && styles.pillSelected]}>
          <Text style={[styles.pillText, selected === opt && styles.pillTextSelected]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderToolFields = () => {
    switch (selectedTool) {
      case 'love-letter':
        return (<>
          <InputField label="What makes them special?" value={detail} onChangeText={setDetail} placeholder="Their laugh, kindness, the way they..." multiline />
          <Text style={styles.fieldLabel}>Occasion</Text>
          {renderPillSelector(OCCASIONS, occasion, setOccasion)}
        </>);
      case 'love-poem':
        return (<>
          <InputField label="A feeling or memory to capture" value={memory} onChangeText={setMemory} placeholder="The first time we danced..." multiline />
          <Text style={styles.fieldLabel}>Style</Text>
          {renderPillSelector(POEM_STYLES, poemStyle, setPoemStyle)}
        </>);
      case 'love-note':
        return <InputField label="One thing you want to say" value={message} onChangeText={setMessage} placeholder="I'm grateful for..." />;
      case 'love-quote':
        return <InputField label="Describe your love in one word" value={word} onChangeText={setWord} placeholder="Infinite, tender, electric..." />;
      case 'date-ideas':
        return (<>
          <InputField label="City" value={city} onChangeText={setCity} placeholder="Paris, Tokyo, your hometown..." />
          <Text style={styles.fieldLabel}>Vibe</Text>
          {renderPillSelector(VIBES, vibe, setVibe)}
        </>);
      case 'conversation-starters':
        return (<>
          <Text style={styles.fieldLabel}>Relationship stage</Text>
          {renderPillSelector(STAGES, stage, setStage)}
        </>);
      default: return null;
    }
  };

  const resultTranslateY = resultAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });

  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color={colors.text_primary} />
            </TouchableOpacity>
            <View style={styles.topBarCenter}>
              <Text style={styles.topBarTitle}>{meta.title}</Text>
              <Text style={styles.topBarSub}>{meta.subtitle}</Text>
            </View>
            <Ionicons name={meta.icon as any} size={24} color={colors.accent_violet} />
          </View>
          <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <GlassCard style={styles.formPanel}>
              {selectedTool !== 'date-ideas' && selectedTool !== 'conversation-starters' && (
                <>
                  <InputField label="For" value={toName} onChangeText={setToName} placeholder="Their first name" />
                  <InputField label="From" value={fromName} onChangeText={setFromName} placeholder="Your name" />
                </>
              )}
              {selectedTool !== 'date-ideas' && selectedTool !== 'conversation-starters' && (
                <>
                  <Text style={styles.fieldLabel}>Tone</Text>
                  {renderPillSelector(TONES, tone, setTone)}
                </>
              )}
              {(selectedTool === 'love-letter' || selectedTool === 'love-poem') && (
                <>
                  <Text style={styles.fieldLabel}>Length</Text>
                  {renderPillSelector(LENGTHS, length, setLength)}
                </>
              )}
              {renderToolFields()}
            </GlassCard>
            <GradientButton label={!canGenerate ? 'Unlock More Credits' : meta.cta} onPress={!canGenerate ? () => openPaywall('credits') : handleGenerate} disabled={isLoading} style={styles.generateBtn} />
            <Text style={styles.disclaimer}>AI-powered · Free to try · Beautiful output</Text>
            {isLoading && <LoadingPulse />}
            {showResult && result && (
              <Animated.View style={[styles.resultContainer, { opacity: resultAnim, transform: [{ translateY: resultTranslateY }] }]}>
                <HeartParticles />
                <GlassCard style={styles.resultCard}>
                  <SectionTitle title={`Your ${meta.title}`} />
                  <GoldDivider />
                  <Text style={styles.resultText}>{result}</Text>
                  <GoldDivider />
                  <View style={styles.resultActions}>
                    <GhostButton label="Regenerate" onPress={handleRegenerate} />
                    <GhostButton label="Copy" onPress={handleCopy} />
                    <GhostButton label="Save" onPress={handleSave} />
                    <GradientButton label="Export" onPress={() => setShowExportSheet(true)} small />
                  </View>
                </GlassCard>
              </Animated.View>
            )}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showExportSheet} transparent animationType="slide" onRequestClose={() => setShowExportSheet(false)}>
        <TouchableOpacity style={styles.exportOverlay} activeOpacity={1} onPress={() => setShowExportSheet(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.exportSheet, { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.xl }]}>
              <View style={styles.exportHandle} />
              <View style={styles.exportContent}>
                <Text style={styles.exportTitle}>Export Your Creation</Text>
                <View style={styles.exportPreview}>
                  <Text style={styles.exportPreviewText} numberOfLines={5}>{result}</Text>
                  {!isPremium && <Text style={styles.exportWatermark}>LoveTestAI</Text>}
                </View>
                <TouchableOpacity style={styles.exportOptionRow} onPress={handleExportShare} activeOpacity={0.7}>
                  <Ionicons name="share-outline" size={22} color={colors.accent_violet} />
                  <Text style={styles.exportOptionLabel}>Share</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportOptionRow} onPress={handleWhatsAppShare} activeOpacity={0.7}>
                  <Ionicons name="logo-whatsapp" size={22} color={colors.success} />
                  <Text style={styles.exportOptionLabel}>Send via WhatsApp</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportOptionRow} onPress={handleExportCopy} activeOpacity={0.7}>
                  <Ionicons name="copy-outline" size={22} color={colors.accent_violet} />
                  <Text style={styles.exportOptionLabel}>Copy Text</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
                </TouchableOpacity>
                {hasPremiumExport ? (
                  <TouchableOpacity style={styles.exportOptionRow} onPress={() => { Alert.alert('Downloaded', 'Premium card saved.'); setShowExportSheet(false); }} activeOpacity={0.7}>
                    <Ionicons name="download-outline" size={22} color={colors.accent_gold} />
                    <Text style={styles.exportOptionLabel}>Download Premium Card</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.exportLockedRow} onPress={() => {
                    Alert.alert('Premium Card Export', 'Choose an option:', [
                      { text: 'Single · $0.50', onPress: () => { purchaseIAP('premium_card_single'); Alert.alert('Unlocked!', 'Card unlocked.'); } },
                      { text: 'All Styles · $0.99', onPress: () => { purchaseIAP('premium_card_all'); Alert.alert('Unlocked!', 'All styles unlocked.'); } },
                      { text: 'See Plans', onPress: () => { setShowExportSheet(false); openPaywall(); } },
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  }} activeOpacity={0.7}>
                    <View style={styles.exportLockedInner}>
                      <Ionicons name="download-outline" size={22} color={colors.accent_violet} />
                      <Text style={styles.exportOptionLabel}>Download Premium Card</Text>
                    </View>
                    <View style={styles.exportLockedBadge}><GoldBadge label="FROM $0.50" /></View>
                  </TouchableOpacity>
                )}
                <GhostButton label="Close" onPress={() => setShowExportSheet(false)} style={styles.exportCloseBtn} />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenBackground>
  );
}
