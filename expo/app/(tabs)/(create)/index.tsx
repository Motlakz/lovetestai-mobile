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
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const TOOLS = [
  { id: 'love-letter', icon: 'mail-outline' as const, label: 'Love Letter' },
  { id: 'love-poem', icon: 'book-outline' as const, label: 'Love Poem' },
  { id: 'love-note', icon: 'chatbox-outline' as const, label: 'Love Note' },
  { id: 'love-quote', icon: 'text-outline' as const, label: 'Love Quote' },
  { id: 'date-ideas', icon: 'location-outline' as const, label: 'Date Ideas' },
  { id: 'conversation-starters', icon: 'people-outline' as const, label: 'Starters' },
];

const TONES = ['Romantic', 'Playful', 'Sincere', 'Poetic'];
const LENGTHS = ['Short', 'Medium', 'Long'];
const OCCASIONS = ['Birthday', 'Anniversary', 'Just Because', 'First Valentine'];
const POEM_STYLES = ['Rhyming', 'Free Verse', 'Haiku', 'Sonnet'];
const VIBES = ['Cozy', 'Adventurous', 'Romantic', 'Budget-Friendly'];
const STAGES = ['New Together', 'Dating', 'Long-Term', 'Married'];

const CTA_LABELS: Record<string, string> = {
  'love-letter': 'Write the Letter',
  'love-poem': 'Create the Poem',
  'love-note': 'Craft the Note',
  'love-quote': 'Generate a Quote',
  'date-ideas': 'Find Date Ideas',
  'conversation-starters': 'Get Conversation Starters',
};

function createStyles(c: ThemeColors, s: ThemeShadows) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
    headerTitle: { fontSize: fontSizes['2xl'], color: c.text_primary, fontWeight: '700' as const, letterSpacing: -0.5 },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
    counterBanner: { padding: spacing.lg, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: spacing.lg, gap: spacing.md },
    counterBannerEmpty: { borderColor: c.error },
    counterText: { color: c.text_secondary, fontSize: fontSizes.sm, flex: 1 },
    counterTextEmpty: { color: c.error },
    toolRow: { marginBottom: spacing.lg },
    toolChip: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.full, borderWidth: 1, borderColor: c.glass_border, backgroundColor: c.glass_fill, marginRight: spacing.sm },
    toolChipSelected: { borderColor: c.accent_rose, backgroundColor: 'rgba(255,61,127,0.12)' },
    toolLabel: { color: c.text_muted, fontSize: fontSizes.sm, fontWeight: '500' as const },
    toolLabelSelected: { color: c.text_primary },
    formPanel: { padding: spacing.xl, marginBottom: spacing.lg },
    fieldLabel: { color: c.text_secondary, fontSize: fontSizes.sm, fontWeight: '500' as const, marginBottom: spacing.sm, marginTop: spacing.sm },
    pillRow: { flexDirection: 'row' as const, marginBottom: spacing.md },
    pill: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.full, borderWidth: 1, borderColor: c.glass_border, marginRight: spacing.sm, backgroundColor: c.glass_fill },
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
    exportPreview: { backgroundColor: c.bg_elevated, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: c.glass_border, position: 'relative' as const },
    exportPreviewText: { color: c.text_primary, fontSize: fontSizes.sm, lineHeight: 22, maxHeight: 120 },
    exportWatermark: { fontSize: fontSizes.xs, color: c.text_muted, textAlign: 'right' as const, marginTop: spacing.md, fontStyle: 'italic' as const },
    exportGoldBorder: { borderLeftWidth: 3, borderLeftColor: c.accent_gold, paddingLeft: spacing.md },
    exportOptionRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: spacing.lg, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: c.glass_border },
    exportOptionLabel: { flex: 1, fontSize: fontSizes.base, color: c.text_primary },
    exportLockedRow: { position: 'relative' as const, overflow: 'hidden' as const, borderRadius: radius.md },
    exportLockedInner: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: spacing.lg, paddingHorizontal: spacing.md, gap: spacing.md, opacity: 0.4 },
    exportLockedBadge: { position: 'absolute' as const, right: spacing.md, top: spacing.lg },
    exportCloseBtn: { marginTop: spacing.sm },
  });
}

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { generationsRemaining, incrementGenerations, saveCreation, profile, isPremium, openPaywall, purchaseIAP } = useApp();
  const [selectedTool, setSelectedTool] = useState('love-letter');
  const [toName, setToName] = useState('');
  const [fromName, setFromName] = useState('');
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

  const handleGenerate = useCallback(async () => {
    if (generationsRemaining <= 0) {
      openPaywall();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, 300);
    } catch (error) {
      console.log('Generation error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTool, fromName, toName, tone, length, detail, occasion, poemStyle, memory, message, word, city, vibe, stage, generationsRemaining, incrementGenerations, resultAnim, profile.apiKey, openPaywall]);

  const handleCopy = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      try { await navigator.clipboard.writeText(result); } catch { console.log('Copy failed on web'); }
    } else {
      await Clipboard.setStringAsync(result);
    }
    Alert.alert('Copied', 'Content copied to clipboard');
  }, [result]);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toolLabel = TOOLS.find(t => t.id === selectedTool)?.label || 'Creation';
    saveCreation({ id: Date.now().toString(), type: toolLabel, content: result, toName, createdAt: new Date().toISOString() });
    Alert.alert('Saved', 'Your creation has been saved to your profile.');
  }, [result, selectedTool, toName, saveCreation]);

  const handleRegenerate = useCallback(() => {
    setShowResult(false);
    setResult('');
    handleGenerate();
  }, [handleGenerate]);

  const handleExportCopy = useCallback(async () => {
    await handleCopy();
    setShowExportSheet(false);
  }, [handleCopy]);

  const handleExportShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toolLabel = TOOLS.find(t => t.id === selectedTool)?.label || 'Creation';
    const shareText = `${toolLabel}\n\n${result}\n\n-- Created with LoveTestAI`;
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: toolLabel, text: shareText });
        } else {
          try { await navigator.clipboard.writeText(shareText); } catch { console.log('Share copy failed'); }
          Alert.alert('Copied', 'Text copied to clipboard. Share it with your friends!');
        }
      } else {
        await Share.share({ message: shareText, title: toolLabel });
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.log('Share error:', error);
      }
    }
    setShowExportSheet(false);
  }, [result, selectedTool]);

  const handleWhatsAppShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toolLabel = TOOLS.find(t => t.id === selectedTool)?.label || 'Creation';
    const shareText = `${toolLabel}\n\n${result}\n\n-- Created with LoveTestAI`;
    const encoded = encodeURIComponent(shareText);
    const url = `whatsapp://send?text=${encoded}`;
    try {
      const supported = Platform.OS !== 'web' && await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else if (Platform.OS === 'web') {
        await Linking.openURL(`https://wa.me/?text=${encoded}`);
      } else {
        Alert.alert('WhatsApp not found', 'WhatsApp is not installed on this device. The text has been copied to your clipboard instead.');
        await Clipboard.setStringAsync(shareText);
      }
    } catch (error) {
      console.log('WhatsApp share error:', error);
      Alert.alert('Error', 'Could not open WhatsApp.');
    }
    setShowExportSheet(false);
  }, [result, selectedTool]);

  const renderPillSelector = (options: string[], selected: string, onSelect: (v: string) => void) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
      {options.map((opt) => (
        <TouchableOpacity key={opt} onPress={() => { onSelect(opt); Haptics.selectionAsync(); }} style={[styles.pill, selected === opt && styles.pillSelected]}>
          <Text style={[styles.pillText, selected === opt && styles.pillTextSelected]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderToolFields = () => {
    switch (selectedTool) {
      case 'love-letter':
        return (
          <>
            <InputField label="What makes them special?" value={detail} onChangeText={setDetail} placeholder="Their laugh, kindness, the way they..." multiline />
            <Text style={styles.fieldLabel}>Occasion</Text>
            {renderPillSelector(OCCASIONS, occasion, setOccasion)}
          </>
        );
      case 'love-poem':
        return (
          <>
            <InputField label="A feeling or memory to capture" value={memory} onChangeText={setMemory} placeholder="The first time we danced, a rainy morning..." multiline />
            <Text style={styles.fieldLabel}>Style</Text>
            {renderPillSelector(POEM_STYLES, poemStyle, setPoemStyle)}
          </>
        );
      case 'love-note':
        return <InputField label="One thing you want to say" value={message} onChangeText={setMessage} placeholder="I'm grateful for..." />;
      case 'love-quote':
        return <InputField label="Describe your love in one word" value={word} onChangeText={setWord} placeholder="Infinite, tender, electric..." />;
      case 'date-ideas':
        return (
          <>
            <InputField label="City" value={city} onChangeText={setCity} placeholder="Paris, Tokyo, your hometown..." />
            <Text style={styles.fieldLabel}>Vibe</Text>
            {renderPillSelector(VIBES, vibe, setVibe)}
          </>
        );
      case 'conversation-starters':
        return (
          <>
            <Text style={styles.fieldLabel}>Relationship stage</Text>
            {renderPillSelector(STAGES, stage, setStage)}
          </>
        );
      default:
        return null;
    }
  };

  const resultTranslateY = resultAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
  const toolLabel = TOOLS.find(t => t.id === selectedTool)?.label || 'Creation';

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create</Text>
        </View>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {!isPremium && generationsRemaining < 3 && (
            <GlassCard style={[styles.counterBanner, generationsRemaining === 0 && styles.counterBannerEmpty]}>
              <Text style={[styles.counterText, generationsRemaining === 0 && styles.counterTextEmpty]}>
                {generationsRemaining > 0 ? `${generationsRemaining} free creation${generationsRemaining > 1 ? 's' : ''} remaining this month` : 'Monthly limit reached'}
              </Text>
              <GradientButton label={generationsRemaining > 0 ? 'Unlock Unlimited' : 'Get 5 Credits · $0.99'} onPress={() => {
                if (generationsRemaining <= 0) {
                  Alert.alert('Get More Credits', 'Choose an option:', [
                    { text: '5 Credits · $0.99', onPress: () => { purchaseIAP('credit_pack_5'); Alert.alert('Purchased!', '5 credits added to your account.'); } },
                    { text: 'Unlimited · $3.99/mo', onPress: () => openPaywall() },
                    { text: 'See All Plans', onPress: () => openPaywall() },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                } else {
                  openPaywall();
                }
              }} small />
            </GlassCard>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolRow}>
            {TOOLS.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                onPress={() => { setSelectedTool(tool.id); setShowResult(false); setResult(''); Haptics.selectionAsync(); }}
                style={[styles.toolChip, selectedTool === tool.id && styles.toolChipSelected]}
              >
                <Ionicons name={tool.icon} size={18} color={selectedTool === tool.id ? colors.accent_rose : colors.text_muted} />
                <Text style={[styles.toolLabel, selectedTool === tool.id && styles.toolLabelSelected]}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
          <GradientButton label={CTA_LABELS[selectedTool] || 'Generate'} onPress={handleGenerate} disabled={isLoading || (!isPremium && generationsRemaining <= 0)} style={styles.generateBtn} />
          <Text style={styles.disclaimer}>AI-powered · Free to try · Beautiful output</Text>
          {isLoading && <LoadingPulse />}
          {showResult && result && (
            <Animated.View style={[styles.resultContainer, { opacity: resultAnim, transform: [{ translateY: resultTranslateY }] }]}>
              <HeartParticles />
              <GlassCard style={styles.resultCard}>
                <SectionTitle title={`Your ${toolLabel}`} />
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

      <Modal visible={showExportSheet} transparent animationType="slide" onRequestClose={() => setShowExportSheet(false)}>
        <TouchableOpacity style={styles.exportOverlay} activeOpacity={1} onPress={() => setShowExportSheet(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.exportSheet, { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.xl }]}>
              <View style={styles.exportHandle} />
              <View style={styles.exportContent}>
                <Text style={styles.exportTitle}>Export Your Creation</Text>

                <View style={[styles.exportPreview, styles.exportGoldBorder]}>
                  <Text style={styles.exportPreviewText} numberOfLines={5}>{result}</Text>
                  <Text style={styles.exportWatermark}>LoveTestAI</Text>
                </View>

                <TouchableOpacity style={styles.exportOptionRow} onPress={handleExportShare} activeOpacity={0.7}>
                  <Ionicons name="share-outline" size={22} color={colors.accent_violet} />
                  <Text style={styles.exportOptionLabel}>Share as Text</Text>
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

                {isPremium ? (
                  <TouchableOpacity style={styles.exportOptionRow} onPress={() => { Alert.alert('Downloaded', 'Premium card saved to your gallery.'); setShowExportSheet(false); }} activeOpacity={0.7}>
                    <Ionicons name="download-outline" size={22} color={colors.accent_gold} />
                    <Text style={styles.exportOptionLabel}>Download Premium Card</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.exportLockedRow} onPress={() => {
                    Alert.alert('Premium Card Export', 'Choose an option:', [
                      { text: 'Single Export · $0.50', onPress: () => { purchaseIAP('premium_card_single'); Alert.alert('Unlocked!', 'You can now download this card.'); } },
                      { text: 'All Styles · $0.99', onPress: () => { purchaseIAP('premium_card_all'); Alert.alert('Unlocked!', 'All export styles are now available.'); } },
                      { text: 'See Plans', onPress: () => { setShowExportSheet(false); openPaywall(); } },
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  }} activeOpacity={0.7}>
                    <View style={styles.exportLockedInner}>
                      <Ionicons name="download-outline" size={22} color={colors.accent_violet} />
                      <Text style={styles.exportOptionLabel}>Download Premium Card</Text>
                    </View>
                    <View style={styles.exportLockedBadge}>
                      <GoldBadge label="FROM $0.50" />
                    </View>
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
