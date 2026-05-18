import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
  Linking,
  Share,
  KeyboardAvoidingView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot, { captureRef } from 'react-native-view-shot';
import {
  Feather,
  Flame,
  Flower2,
  Heart,
  Leaf,
  Mail,
  Moon,
  Orbit,
  Shell,
  Sparkles,
  Sun,
  Waves,
  type LucideIcon,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColors, ThemeShadows, fontSizes, spacing, radius } from '@/constants/theme';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import GhostButton from '@/components/ui/GhostButton';
import GoldDivider from '@/components/ui/GoldDivider';
import SectionTitle from '@/components/ui/SectionTitle';
import InputField from '@/components/ui/InputField';
import SelectField from '@/components/ui/SelectField';
import LoadingPulse from '@/components/ui/LoadingPulse';
import HeartParticles from '@/components/ui/HeartParticles';
import { useApp } from '@/context/AppContext';
import { generateContent } from '@/services/aiService';
import { useToast } from '@/components/ui/Toast';
import { useAppAlert } from '@/components/ui/AppAlertModal';
import { useFeedbackStore } from '@/store/feedbackStore';
import { useAuthStore } from '@/store/authStore';
import { useInboxStore } from '@/store/inboxStore';
import { usePartnerStore } from '@/store/partnerStore';
import { sharePartnerItem } from '@/services/partnerExchange';
import {
  buildViralCreationShareText,
  getDefaultTemplateForTool,
  getTemplatesForTool,
  type CreationTemplateId,
} from '@/services/creationTemplates';

const TOOL_META: Record<string, { title: string; icon: string; subtitle: string; cta: string }> = {
  'love-letter': { title: 'Love Letter', icon: 'mail-outline', subtitle: 'Write a heartfelt, deeply personal letter', cta: 'Write the Letter' },
  'love-poem': { title: 'Love Poem', icon: 'book-outline', subtitle: 'Craft a beautiful romantic poem', cta: 'Create the Poem' },
  'love-note': { title: 'Love Note', icon: 'chatbox-outline', subtitle: 'A quick, genuine love note', cta: 'Craft the Note' },
  'love-quote': { title: 'Love Quote', icon: 'text-outline', subtitle: 'Generate an original love quote', cta: 'Generate a Quote' },
};

const VIBES = [
  'romantic and heartfelt',
  'playful and flirty',
  'poetic and dreamy',
  'sweet and simple',
  'passionate and intense',
  'nostalgic and tender',
];
const LENGTHS = ['Short', 'Medium', 'Long'];
const OCCASIONS = [
  'just because',
  "valentine's day",
  'anniversary',
  'long distance',
  'apology',
  'missing you',
  'good morning',
  'good night',
];
const POEM_STYLES = ['Rhyming', 'Free Verse', 'Haiku', 'Sonnet'];
const FONT_OPTIONS = [
  { label: 'Cormorant', family: 'CormorantGaramond_600SemiBold' },
  { label: 'Playfair', family: 'PlayfairDisplay_600SemiBold' },
  { label: 'DM Sans', family: 'DMSans_500Medium' },
];
const SIZE_OPTIONS = [
  { label: 'Small', value: 0.9 },
  { label: 'Medium', value: 1 },
  { label: 'Large', value: 1.15 },
];

const GLYPH_ICONS: Record<string, LucideIcon> = {
  feather: Feather,
  flame: Flame,
  flower: Flower2,
  heart: Heart,
  leaf: Leaf,
  mail: Mail,
  moon: Moon,
  planet: Orbit,
  rose: Flower2,
  sparkle: Sparkles,
  sunny: Sun,
  water: Waves,
};

function formatChoiceLabel(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

const VIBE_OPTIONS = VIBES.map((value) => ({ value, label: formatChoiceLabel(value) }));
const OCCASION_OPTIONS = OCCASIONS.map((value) => ({ value, label: formatChoiceLabel(value) }));
const LENGTH_OPTIONS = LENGTHS.map((value) => ({ value, label: value }));
const POEM_STYLE_OPTIONS = POEM_STYLES.map((value) => ({ value, label: value }));

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
    generateBtn: { marginBottom: spacing.sm },
    disclaimer: { color: c.text_muted, fontSize: fontSizes.xs, textAlign: 'center' as const, marginBottom: spacing.xl },
    resultContainer: { marginTop: spacing.md },
    resultCard: { padding: spacing.xl },
    resultText: { color: c.text_primary, fontSize: fontSizes.base, lineHeight: 26 },
    resultActions: { marginTop: spacing.md, gap: spacing.sm },
    resultActionsRow: { flexDirection: 'row' as const, gap: spacing.sm },
    resultActionSlot: { flex: 1 },
    bottomSpacer: { height: 40 },
    exportOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' as const },
    exportSheet: { backgroundColor: c.bg_surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, borderColor: c.glass_border, borderBottomWidth: 0, height: '100%' as const },
    exportHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.glass_border, alignSelf: 'center' as const, marginTop: spacing.md },
    exportHeader: { paddingTop: spacing.lg, paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.md },
    exportScroll: { flex: 1 },
    exportScrollContent: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing.md },
    exportFooter: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: c.glass_border, backgroundColor: c.bg_surface },
    exportTitle: { fontSize: fontSizes.lg, color: c.text_primary, fontWeight: '600' as const, textAlign: 'center' as const },
    exportPreview: { backgroundColor: c.bg_elevated, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: c.glass_border, borderLeftWidth: 3, borderLeftColor: c.accent_gold, paddingLeft: spacing.lg },
    exportPreviewText: { color: c.text_primary, fontSize: fontSizes.sm, lineHeight: 22, maxHeight: 120 },
    templatePreview: { borderRadius: radius.xl, padding: spacing.xl, minHeight: 260, justifyContent: 'space-between' as const, overflow: 'hidden' as const },
    fullExportLayer: { position: 'absolute' as const, left: -10000, top: 0, width: 1080, opacity: 0 },
    fullTemplatePreview: { width: 1080, minHeight: 1350, borderRadius: 48, padding: 96, justifyContent: 'space-between' as const, overflow: 'hidden' as const },
    fullTemplateBadge: { alignSelf: 'flex-start' as const, borderRadius: radius.full, paddingHorizontal: 36, paddingVertical: 18 },
    fullTemplateBadgeText: { fontSize: 28, fontWeight: '700' as const, letterSpacing: 2, textTransform: 'uppercase' as const },
    fullTemplateBody: { lineHeight: 72, fontWeight: '600' as const, marginVertical: 72 },
    fullTemplateFooter: { fontSize: 28, fontWeight: '600' as const, letterSpacing: 2.4, textTransform: 'uppercase' as const },
    templateGlyph: { position: 'absolute' as const },
    templateBadge: { alignSelf: 'flex-start' as const, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
    templateBadgeText: { fontSize: fontSizes.xs, fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
    templateBody: { lineHeight: 30, fontWeight: '600' as const, marginVertical: spacing.xl },
    templateFooter: { fontSize: fontSizes.xs, fontWeight: '600' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
    templateGroup: { marginBottom: spacing.sm },
    templateGroupLabel: {
      color: c.text_muted,
      fontSize: fontSizes.xs,
      fontWeight: '700' as const,
      letterSpacing: 1.4,
      textTransform: 'uppercase' as const,
      marginBottom: spacing.sm,
    },
    templateRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm, alignItems: 'center' as const },
    templateChip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.full,
      borderWidth: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 36,
    },
    templateChipText: { fontSize: fontSizes.sm, fontWeight: '600' as const, lineHeight: 18 },
    exportWatermark: { fontSize: fontSizes.xs, color: c.text_muted, textAlign: 'right' as const, marginTop: spacing.md, fontStyle: 'italic' as const },
    exportOptionRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: spacing.lg, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: c.glass_border },
    exportOptionLabel: { flex: 1, fontSize: fontSizes.base, color: c.text_primary },
    exportLockedRow: { position: 'relative' as const, overflow: 'hidden' as const, borderRadius: radius.md },
    exportLockedInner: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: spacing.lg, paddingHorizontal: spacing.md, gap: spacing.md, opacity: 0.4 },
    exportLockedBadge: { position: 'absolute' as const, right: spacing.md, top: spacing.lg },
    exportCloseBtn: { marginTop: 0 },
  });
}

export default function CreateModeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tool } = useLocalSearchParams<{ tool: string }>();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { saveCreation, profile } = useApp();
  const toast = useToast();
  const { alert } = useAppAlert();
  const recordFeedbackUse = useFeedbackStore((state) => state.recordUse);
  const account = useAuthStore((s) => s.account);
  const partnerLink = usePartnerStore((s) => s.link);

  const meta = TOOL_META[tool || 'love-letter'] || TOOL_META['love-letter'];

  const [toName, setToName] = useState('');
  const [fromName, setFromName] = useState(profile.name || '');
  const [tone, setTone] = useState('romantic and heartfelt');
  const [length, setLength] = useState('Medium');
  const [detail, setDetail] = useState('');
  const [occasion, setOccasion] = useState('just because');
  const [poemStyle, setPoemStyle] = useState('Free Verse');
  const [memory, setMemory] = useState('');
  const [message, setMessage] = useState('');
  const [word, setWord] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const defaultTemplate = useMemo(() => getDefaultTemplateForTool(tool || 'love-letter'), [tool]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<CreationTemplateId>(defaultTemplate.id);
  const [selectedFontFamily, setSelectedFontFamily] = useState(FONT_OPTIONS[0].family);
  const [selectedSizeScale, setSelectedSizeScale] = useState(SIZE_OPTIONS[1].value);

  const resultAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const exportShotRef = useRef<ViewShot | null>(null);
  const fullExportShotRef = useRef<ViewShot | null>(null);
  const selectedTool = tool || 'love-letter';
  const availableTemplates = useMemo(() => getTemplatesForTool(selectedTool), [selectedTool]);
  const selectedTemplate = availableTemplates.find((template) => template.id === selectedTemplateId) ?? defaultTemplate;

  useEffect(() => {
    setSelectedTemplateId(defaultTemplate.id);
  }, [defaultTemplate.id]);

  const handleGenerate = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setShowResult(false);
    resultAnim.setValue(0);
    try {
      const content = await generateContent(
        { tool: selectedTool, fromName, toName, tone, length, detail, occasion, style: poemStyle, memory, message, word }
      );
      setResult(content);
      setShowResult(true);
      void recordFeedbackUse(`generator:${selectedTool}`);
      void useInboxStore.getState().push({
        kind: 'creation_generated',
        title: `${meta.title} generated`,
        body: toName ? `A new ${meta.title.toLowerCase()} for ${toName} is ready.` : `Your new ${meta.title.toLowerCase()} is ready.`,
      });
      Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, damping: 15 }).start();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, 300);
    } catch (error) {
      console.log('Generation error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTool, fromName, toName, tone, length, detail, occasion, poemStyle, memory, message, word, resultAnim, toast, recordFeedbackUse, meta.title]);

  const handleCopy = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      try { await navigator.clipboard.writeText(result); } catch { console.log('Copy failed on web'); }
    } else {
      await Clipboard.setStringAsync(result);
    }
    toast.success('Content copied to clipboard');
  }, [result, toast]);

  const handleSave = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveCreation({ id: Date.now().toString(), type: meta.title, content: result, toName, createdAt: new Date().toISOString() });
    toast.success('Saved to your profile.');
    void useInboxStore.getState().push({
      kind: 'creation_saved',
      title: `${meta.title} saved`,
      body: toName ? `Saved your ${meta.title.toLowerCase()} for ${toName} to your profile.` : `Saved your ${meta.title.toLowerCase()} to your profile.`,
      route: '/(tabs)/profile',
    });
  }, [result, meta.title, toName, saveCreation, toast]);

  const handleRegenerate = useCallback(() => {
    setShowResult(false);
    setResult('');
    void handleGenerate();
  }, [handleGenerate]);

  const handleExportShare = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const shareText = buildViralCreationShareText({
      type: meta.title,
      content: result,
      toName,
      templateName: selectedTemplate.name,
    });
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: meta.title, text: shareText });
        } else {
          try { await navigator.clipboard.writeText(shareText); } catch { console.log('Share copy failed'); }
          toast.success('Text copied to clipboard.');
        }
      } else {
        await Share.share({ message: shareText, title: meta.title });
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share') console.log('Share error:', error);
    }
    setShowExportSheet(false);
  }, [result, meta.title, selectedTemplate.name, toast, toName]);

  const handleWhatsAppShare = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const shareText = buildViralCreationShareText({
      type: meta.title,
      content: result,
      toName,
      templateName: selectedTemplate.name,
    });
    const encoded = encodeURIComponent(shareText);
    const url = `whatsapp://send?text=${encoded}`;
    try {
      const supported = Platform.OS !== 'web' && await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else if (Platform.OS === 'web') {
        await Linking.openURL(`https://wa.me/?text=${encoded}`);
      } else {
        await Clipboard.setStringAsync(shareText);
        alert({ title: 'WhatsApp not found', message: 'Text copied to clipboard instead.', icon: 'logo-whatsapp' });
      }
    } catch (error) { console.log('WhatsApp share error:', error); }
    setShowExportSheet(false);
  }, [result, meta.title, alert, selectedTemplate.name, toName]);

  const handleExportCopy = useCallback(async () => {
    await handleCopy();
    setShowExportSheet(false);
  }, [handleCopy]);

  const handleSendToPartner = useCallback(async () => {
    if (!result) return;
    if (!account) {
      toast.warning('Sign-in not ready yet.');
      return;
    }
    if (!partnerLink?.pairId) {
      toast.info('Pair with someone first in Partner Mode.');
      setShowExportSheet(false);
      router.push('/(tabs)/partner' as any);
      return;
    }
    if (!partnerLink.pairId.includes(account.accountId)) {
      toast.error('Pair belongs to a previous identity. Reconnect first.');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await sharePartnerItem({
        pairId: partnerLink.pairId,
        kind: 'creation',
        title: toName ? `${meta.title} for ${toName}` : meta.title,
        body: result,
        account,
        senderName: profile.name?.trim() || account.displayName || account.email || null,
      });
      toast.success('Sent to your partner.');
      setShowExportSheet(false);
    } catch (e) {
      console.log('partner creation share failed:', e);
      toast.error('Could not send to partner.');
    }
  }, [account, meta.title, partnerLink, profile.name, result, router, toName, toast]);

  const captureTemplateImage = useCallback(async () => {
    const targetRef = fullExportShotRef.current ?? exportShotRef.current;
    if (!targetRef) {
      throw new Error('Export card is not ready.');
    }
    return await captureRef(targetRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
  }, []);

  const handleShareSnapshot = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const uri = await captureTemplateImage();
      if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share ${meta.title}`,
          UTI: 'public.png',
        });
      } else {
        toast.info('Image sharing is not available on this device.');
      }
      setShowExportSheet(false);
    } catch (error) {
      console.log('Snapshot share failed:', error);
      toast.error('Could not create the image export.');
    }
  }, [captureTemplateImage, meta.title, toast]);

  const handleDownloadSnapshot = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const uri = await captureTemplateImage();
      if (Platform.OS === 'web') {
        toast.info('Use Share Image on web to export this card.');
        return;
      }

      const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
      if (!permission.granted) {
        toast.warning('Photo permission is needed to save the image.');
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      try {
        await MediaLibrary.createAlbumAsync('Love Test AI', asset, false);
      } catch {
        await MediaLibrary.saveToLibraryAsync(uri);
      }
      toast.success('Image saved to your gallery.');
      setShowExportSheet(false);
    } catch (error) {
      console.log('Snapshot save failed:', error);
      toast.error('Could not save the image export.');
    }
  }, [captureTemplateImage, toast]);

  const renderToolFields = () => {
    switch (selectedTool) {
      case 'love-letter':
        return (<>
          <InputField label="What makes them special?" value={detail} onChangeText={setDetail} placeholder="Their laugh, kindness, the way they..." multiline />
          <SelectField label="Occasion" value={occasion} onChange={setOccasion} options={OCCASION_OPTIONS} placeholder="Choose an occasion" />
        </>);
      case 'love-poem':
        return (<>
          <InputField label="A feeling or memory to capture" value={memory} onChangeText={setMemory} placeholder="The first time we danced..." multiline />
          <SelectField label="Occasion" value={occasion} onChange={setOccasion} options={OCCASION_OPTIONS} placeholder="Choose an occasion" />
          <SelectField label="Style" value={poemStyle} onChange={setPoemStyle} options={POEM_STYLE_OPTIONS} placeholder="Choose a poem style" />
        </>);
      case 'love-note':
        return (<>
          <InputField label="One thing you want to say" value={message} onChangeText={setMessage} placeholder="I'm grateful for..." />
          <SelectField label="Occasion" value={occasion} onChange={setOccasion} options={OCCASION_OPTIONS} placeholder="Choose an occasion" />
        </>);
      case 'love-quote':
        return <InputField label="Describe your love in one word" value={word} onChangeText={setWord} placeholder="Infinite, tender, electric..." />;
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
              <>
                <InputField label="For" value={toName} onChangeText={setToName} placeholder="Their first name" />
                <InputField label="From" value={fromName} onChangeText={setFromName} placeholder="Your name" />
              </>
              <SelectField label="Vibe" value={tone} onChange={setTone} options={VIBE_OPTIONS} placeholder="Choose a vibe" />
              {(selectedTool === 'love-letter' || selectedTool === 'love-poem') && (
                <SelectField label="Length" value={length} onChange={setLength} options={LENGTH_OPTIONS} placeholder="Choose a length" />
              )}
              {renderToolFields()}
            </GlassCard>
            <GradientButton label={meta.cta} onPress={handleGenerate} disabled={isLoading} style={styles.generateBtn} />
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
                    <View style={styles.resultActionsRow}>
                      <GhostButton label="Regenerate" onPress={handleRegenerate} small style={styles.resultActionSlot} />
                      <GhostButton label="Copy" onPress={handleCopy} small style={styles.resultActionSlot} />
                      <GhostButton label="Save" onPress={handleSave} small style={styles.resultActionSlot} />
                    </View>
                    <GradientButton label="Export" onPress={() => setShowExportSheet(true)} small noTopMargin />
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
            <View style={styles.exportSheet}>
              <View pointerEvents="none" style={styles.fullExportLayer}>
                <ViewShot ref={fullExportShotRef} options={{ format: 'png', quality: 1 }}>
                  <LinearGradient colors={selectedTemplate.background as any} style={styles.fullTemplatePreview} collapsable={false}>
                    {selectedTemplate.glyphs.map((glyph, index) => (
                      <View
                        key={`full-${glyph.symbol}-${index}`}
                        style={[
                          styles.templateGlyph,
                          {
                            left: glyph.x,
                            top: glyph.y,
                            opacity: glyph.opacity,
                            transform: [{ rotate: `${glyph.rotate}deg` }],
                          },
                        ]}
                      >
                        {React.createElement(GLYPH_ICONS[glyph.symbol] ?? Shell, {
                          size: glyph.size * 3.6,
                          color: selectedTemplate.accent,
                          strokeWidth: 1.4,
                        })}
                      </View>
                    ))}
                    <View style={[styles.fullTemplateBadge, { backgroundColor: selectedTemplate.badge }]}>
                      <Text style={[styles.fullTemplateBadgeText, { color: selectedTemplate.accent }]}>{meta.title}</Text>
                    </View>
                    <Text
                      style={[
                        styles.fullTemplateBody,
                        {
                          color: selectedTemplate.text,
                          fontFamily: selectedFontFamily,
                          fontSize: 48 * selectedSizeScale,
                          lineHeight: 72 * selectedSizeScale,
                        },
                      ]}
                    >
                      {result}
                    </Text>
                    <Text style={[styles.fullTemplateFooter, { color: selectedTemplate.muted }]}>
                      {toName ? `For ${toName} - ` : ''}Love Test AI
                    </Text>
                  </LinearGradient>
                </ViewShot>
              </View>
              <View style={styles.exportHandle} />
              <View style={styles.exportHeader}>
                <Text style={styles.exportTitle}>Export Your Creation</Text>
                <ViewShot ref={exportShotRef} options={{ format: 'png', quality: 1 }}>
                  <LinearGradient colors={selectedTemplate.background as any} style={styles.templatePreview} collapsable={false}>
                    {selectedTemplate.glyphs.map((glyph, index) => (
                      <View
                        key={`${glyph.symbol}-${index}`}
                        style={[
                          styles.templateGlyph,
                          {
                            left: glyph.x,
                            top: glyph.y,
                            opacity: glyph.opacity,
                            transform: [{ rotate: `${glyph.rotate}deg` }],
                          },
                        ]}
                      >
                        {React.createElement(GLYPH_ICONS[glyph.symbol] ?? Shell, {
                          size: glyph.size,
                          color: selectedTemplate.accent,
                          strokeWidth: 1.4,
                        })}
                      </View>
                    ))}
                    <View style={[styles.templateBadge, { backgroundColor: selectedTemplate.badge }]}>
                      <Text style={[styles.templateBadgeText, { color: selectedTemplate.accent }]}>{meta.title}</Text>
                    </View>
                    <Text
                      style={[
                        styles.templateBody,
                        {
                          color: selectedTemplate.text,
                          fontFamily: selectedFontFamily,
                          fontSize: fontSizes.lg * selectedSizeScale,
                          lineHeight: 30 * selectedSizeScale,
                        },
                      ]}
                      numberOfLines={7}
                    >
                      {result}
                    </Text>
                    <Text style={[styles.templateFooter, { color: selectedTemplate.muted }]}>
                      {toName ? `For ${toName} - ` : ''}Love Test AI
                    </Text>
                  </LinearGradient>
                </ViewShot>
              </View>
              <ScrollView
                style={styles.exportScroll}
                contentContainerStyle={styles.exportScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.templateGroup}>
                  <Text style={styles.templateGroupLabel}>Template</Text>
                  <View style={styles.templateRow}>
                    {availableTemplates.slice(0, 4).map((template) => (
                      <TouchableOpacity
                        key={template.id}
                        onPress={() => {
                          setSelectedTemplateId(template.id);
                          void Haptics.selectionAsync();
                        }}
                        activeOpacity={0.85}
                        style={[
                          styles.templateChip,
                          {
                            borderColor: selectedTemplateId === template.id ? template.accent : colors.glass_border,
                            backgroundColor: selectedTemplateId === template.id ? `${template.accent}1F` : colors.glass_fill,
                          },
                        ]}
                      >
                        <Text style={[styles.templateChipText, { color: selectedTemplateId === template.id ? template.accent : colors.text_secondary }]}>
                          {template.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.templateGroup}>
                  <Text style={styles.templateGroupLabel}>Font</Text>
                  <View style={styles.templateRow}>
                    {FONT_OPTIONS.map((font) => (
                      <TouchableOpacity
                        key={font.family}
                        onPress={() => {
                          setSelectedFontFamily(font.family);
                          void Haptics.selectionAsync();
                        }}
                        activeOpacity={0.85}
                        style={[
                          styles.templateChip,
                          {
                            borderColor: selectedFontFamily === font.family ? selectedTemplate.accent : colors.glass_border,
                            backgroundColor: selectedFontFamily === font.family ? `${selectedTemplate.accent}1F` : colors.glass_fill,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.templateChipText,
                            {
                              color: selectedFontFamily === font.family ? selectedTemplate.accent : colors.text_secondary,
                              fontFamily: font.family,
                            },
                          ]}
                        >
                          {font.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.templateGroup}>
                  <Text style={styles.templateGroupLabel}>Size</Text>
                  <View style={styles.templateRow}>
                    {SIZE_OPTIONS.map((size) => (
                      <TouchableOpacity
                        key={size.label}
                        onPress={() => {
                          setSelectedSizeScale(size.value);
                          void Haptics.selectionAsync();
                        }}
                        activeOpacity={0.85}
                        style={[
                          styles.templateChip,
                          {
                            borderColor: selectedSizeScale === size.value ? selectedTemplate.accent : colors.glass_border,
                            backgroundColor: selectedSizeScale === size.value ? `${selectedTemplate.accent}1F` : colors.glass_fill,
                          },
                        ]}
                      >
                        <Text style={[styles.templateChipText, { color: selectedSizeScale === size.value ? selectedTemplate.accent : colors.text_secondary }]}>
                          {size.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TouchableOpacity style={styles.exportOptionRow} onPress={handleExportShare} activeOpacity={0.7}>
                  <Ionicons name="share-outline" size={22} color={colors.accent_violet} />
                  <Text style={styles.exportOptionLabel}>Share Text</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportOptionRow} onPress={handleShareSnapshot} activeOpacity={0.7}>
                  <Ionicons name="image-outline" size={22} color={colors.accent_violet} />
                  <Text style={styles.exportOptionLabel}>Share Image</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportOptionRow} onPress={handleDownloadSnapshot} activeOpacity={0.7}>
                  <Ionicons name="download-outline" size={22} color={colors.accent_gold} />
                  <Text style={styles.exportOptionLabel}>Save Image</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportOptionRow} onPress={handleWhatsAppShare} activeOpacity={0.7}>
                  <Ionicons name="logo-whatsapp" size={22} color={colors.success} />
                  <Text style={styles.exportOptionLabel}>Send via WhatsApp</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportOptionRow} onPress={handleSendToPartner} activeOpacity={0.7}>
                  <Ionicons name="heart-circle-outline" size={22} color={colors.accent_rose} />
                  <Text style={styles.exportOptionLabel}>Send to Partner Mode</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportOptionRow} onPress={handleExportCopy} activeOpacity={0.7}>
                  <Ionicons name="copy-outline" size={22} color={colors.accent_violet} />
                  <Text style={styles.exportOptionLabel}>Copy Text</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
                </TouchableOpacity>
              </ScrollView>
              <View style={[styles.exportFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
                <GhostButton label="Close" onPress={() => setShowExportSheet(false)} style={styles.exportCloseBtn} />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenBackground>
  );
}
