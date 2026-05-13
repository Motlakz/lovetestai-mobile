import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColors, ThemeShadows, fontSizes, spacing, radius } from '@/constants/theme';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import GhostButton from '@/components/ui/GhostButton';
import LockedOverlay from '@/components/ui/LockedOverlay';
import { useApp } from '@/context/AppContext';
import { sendCoachMessage, rewriteMessage } from '@/services/aiService';

interface ChatMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: string;
  isRewrite?: boolean;
}

const QUICK_PROMPTS = [
  'How do I start a hard conversation?',
  'Help me rewrite a message',
  'Am I being too demanding?',
  'How do I reconnect with my partner?',
  'What does my attachment style mean?',
];

const REWRITE_TONES = ['Kinder', 'Clearer', 'More Romantic', 'Firmer'];
const MAX_CHARS = 500;

const OPENING_MESSAGE: ChatMessage = {
  id: 'opening',
  role: 'coach',
  content: "What's on your mind today? Whether you're working through a difficult conversation, feeling disconnected, or just want to think more clearly about your relationship - I'm here.",
  timestamp: new Date().toISOString(),
};

function createStyles(c: ThemeColors, s: ThemeShadows) {
  return StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1 },
    header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
    headerTitle: { fontSize: fontSizes['2xl'], color: c.text_primary, fontWeight: '700' as const, letterSpacing: -0.5 },
    headerSub: { fontSize: fontSizes.sm, color: c.text_secondary, marginTop: spacing.xs },
    disclaimer: { marginHorizontal: spacing.xl, padding: spacing.md, marginBottom: spacing.md },
    disclaimerText: { fontSize: fontSizes.xs, color: c.text_muted, textAlign: 'center' as const },
    lockedContainer: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, paddingHorizontal: spacing.xl },
    chatArea: { flex: 1, paddingHorizontal: spacing.xl },
    chatContent: { paddingBottom: spacing.lg, gap: spacing.md },
    identityCard: { padding: spacing.xl, alignItems: 'center' as const, gap: spacing.sm, marginBottom: spacing.md },
    identityTitle: { fontSize: fontSizes.lg, color: c.text_primary, fontWeight: '600' as const },
    identityDesc: { fontSize: fontSizes.sm, color: c.text_secondary, textAlign: 'center' as const, lineHeight: 20 },
    identityNote: { fontSize: fontSizes.xs, color: c.text_muted },
    messageRow: { flexDirection: 'row' as const, gap: spacing.sm },
    messageRowCoach: { justifyContent: 'flex-start' as const },
    messageRowUser: { justifyContent: 'flex-end' as const },
    avatarContainer: { marginTop: spacing.xs },
    bubble: { maxWidth: '78%' },
    coachBubbleInner: { padding: spacing.lg },
    coachText: { fontSize: fontSizes.base, color: c.text_secondary, lineHeight: 22 },
    userGradient: { padding: spacing.lg, borderRadius: radius.xl },
    userText: { fontSize: fontSizes.base, color: c.text_on_grad, lineHeight: 22 },
    typingRow: { flexDirection: 'row' as const, gap: spacing.sm, alignItems: 'flex-end' as const },
    typingBubble: { padding: spacing.md, paddingHorizontal: spacing.lg },
    typingText: { fontSize: fontSizes.lg, color: c.text_muted, letterSpacing: 4 },
    quickPromptsRow: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, maxHeight: 50 },
    quickPromptChip: { backgroundColor: c.glass_fill, borderWidth: 1, borderColor: c.glass_border, borderRadius: radius.full, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, marginRight: spacing.sm },
    quickPromptText: { fontSize: fontSizes.sm, color: c.text_secondary },
    rewritePanel: { marginHorizontal: spacing.xl, padding: spacing.lg, marginBottom: spacing.sm, gap: spacing.md },
    rewriteLabel: { fontSize: fontSizes.xs, color: c.text_muted, letterSpacing: 1.5, textTransform: 'uppercase' as const },
    rewriteInput: { backgroundColor: c.glass_fill, borderWidth: 1, borderColor: c.glass_border, borderRadius: radius.md, padding: spacing.md, color: c.text_primary, fontSize: fontSizes.base, minHeight: 60, textAlignVertical: 'top' as const },
    toneRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm },
    tonePill: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1, borderColor: c.glass_border },
    tonePillSelected: { borderColor: c.accent_rose, backgroundColor: 'rgba(255,61,127,0.12)' },
    tonePillText: { fontSize: fontSizes.sm, color: c.text_muted },
    tonePillTextSelected: { color: c.text_primary },
    rewriteActions: { flexDirection: 'row' as const, gap: spacing.sm },
    inputBarOuter: { marginHorizontal: spacing.xl },
    inputBar: { padding: spacing.md, flexDirection: 'row' as const, alignItems: 'flex-end' as const, gap: spacing.sm },
    textInput: { flex: 1, color: c.text_primary, fontSize: fontSizes.base, maxHeight: 100, paddingVertical: spacing.xs },
    charCount: { fontSize: fontSizes.xs, color: c.text_muted, textAlign: 'right' as const, paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
    sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, ...s.rose_glow },
    sendBtnDisabled: { opacity: 0.5 },
    copyRewriteBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' as const },
    copyRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.xs, marginTop: spacing.sm },
    copyText: { fontSize: fontSizes.xs, color: c.accent_gold },
    sessionInfo: { paddingHorizontal: spacing.xl, paddingVertical: spacing.xs },
    sessionText: { fontSize: fontSizes.xs, color: c.text_muted, textAlign: 'center' as const },
    timestampText: { fontSize: fontSizes.xs, color: c.text_muted, marginTop: spacing.xs },
  });
}

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { coachSessionsRemaining, incrementCoachSessions, hasCoach, canUseCoach, openPaywall, restorePurchases } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([OPENING_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showRewritePanel, setShowRewritePanel] = useState(false);
  const [rewriteText, setRewriteText] = useState('');
  const [rewriteTone, setRewriteTone] = useState('Kinder');
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  const scrollRef = useRef<ScrollView>(null);

  const isLocked = !canUseCoach;

  useEffect(() => {
    setTimeout(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, 100);
  }, [messages]);

  const handleCopyText = useCallback(async (text: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      try { await navigator.clipboard.writeText(text); } catch { console.log('Copy failed on web'); }
    } else {
      await Clipboard.setStringAsync(text);
    }
    Alert.alert('Copied', 'Message copied to clipboard');
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (messageText.toLowerCase().includes('rewrite')) { setShowRewritePanel(true); }
    setShowQuickPrompts(false);
    setInputText('');
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: messageText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const apiMessages = [...messages, userMessage].filter(m => m.id !== 'opening').map(m => ({ role: m.role === 'coach' ? 'assistant' : 'user', content: m.content }));
      if (apiMessages.length === 1) { incrementCoachSessions(); }
      const response = await sendCoachMessage(apiMessages);
      const coachMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'coach', content: response, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, coachMessage]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Coach error:', error);
      Alert.alert('Error', 'Could not get a response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  }, [inputText, messages, incrementCoachSessions]);

  const handleRewrite = useCallback(async () => {
    if (!rewriteText.trim()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowRewritePanel(false);
    setIsTyping(true);
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: `Please rewrite this message in a ${rewriteTone.toLowerCase()} tone: "${rewriteText}"`, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    try {
      const response = await rewriteMessage(rewriteText, rewriteTone);
      const coachMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'coach', content: response, timestamp: new Date().toISOString(), isRewrite: true };
      setMessages(prev => [...prev, coachMessage]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Rewrite error:', error);
      Alert.alert('Error', 'Could not rewrite message. Please try again.');
    } finally {
      setIsTyping(false);
      setRewriteText('');
    }
  }, [rewriteText, rewriteTone]);

  const formatTime = useCallback((timestamp: string) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const renderMessage = useCallback((msg: ChatMessage) => {
    const isCoach = msg.role === 'coach';
    return (
      <View key={msg.id}>
        <View style={[styles.messageRow, isCoach ? styles.messageRowCoach : styles.messageRowUser]}>
          {isCoach && (
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle-outline" size={28} color={colors.accent_violet} />
            </View>
          )}
          <View style={styles.bubble}>
            {isCoach ? (
              <GlassCard style={styles.coachBubbleInner}>
                <Text style={styles.coachText}>{msg.content}</Text>
                {msg.isRewrite && (
                  <TouchableOpacity onPress={() => handleCopyText(msg.content)} style={styles.copyRow} activeOpacity={0.7}>
                    <Ionicons name="copy-outline" size={14} color={colors.accent_gold} />
                    <Text style={styles.copyText}>Copy Rewritten Message</Text>
                  </TouchableOpacity>
                )}
              </GlassCard>
            ) : (
              <LinearGradient colors={[colors.grad_rose_start, colors.grad_violet_end]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.userGradient}>
                <Text style={styles.userText}>{msg.content}</Text>
              </LinearGradient>
            )}
            <Text style={[styles.timestampText, !isCoach && { textAlign: 'right' as const }]}>{formatTime(msg.timestamp)}</Text>
          </View>
        </View>
      </View>
    );
  }, [colors, styles, handleCopyText, formatTime]);

  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Coach</Text>
            <Text style={styles.headerSub}>Relationship communication skills</Text>
          </View>
          <GlassCard style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>For personal growth and reflection only. Not a substitute for professional mental health support.</Text>
          </GlassCard>
          {!isLocked && !hasCoach && coachSessionsRemaining < Infinity && (
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionText}>{coachSessionsRemaining} free session{coachSessionsRemaining !== 1 ? 's' : ''} remaining this month</Text>
            </View>
          )}
          {isLocked ? (
            <View style={styles.lockedContainer}>
              <LockedOverlay title="3 free coaching sessions used this month" subtitle="Upgrade for unlimited sessions. Sessions reset on the 1st of each month." ctaLabel="Upgrade to Plus · $8.99/mo" onUpgrade={() => openPaywall('coach')} onRestore={restorePurchases} />
            </View>
          ) : (
            <>
              <ScrollView ref={scrollRef} style={styles.chatArea} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
                {messages.length === 1 && (
                  <GlassCard style={styles.identityCard}>
                    <Ionicons name="person-circle-outline" size={56} color={colors.accent_violet} />
                    <Text style={styles.identityTitle}>Your Relationship Coach</Text>
                    <Text style={styles.identityDesc}>I help you communicate better, reflect deeper, and navigate love with clarity.</Text>
                    <Text style={styles.identityNote}>AI-powered · Not therapy</Text>
                  </GlassCard>
                )}
                {messages.map(renderMessage)}
                {isTyping && (
                  <View style={styles.typingRow}>
                    <View style={styles.avatarContainer}>
                      <Ionicons name="person-circle-outline" size={28} color={colors.accent_violet} />
                    </View>
                    <GlassCard style={styles.typingBubble}>
                      <Text style={styles.typingText}>...</Text>
                    </GlassCard>
                  </View>
                )}
              </ScrollView>
              {showQuickPrompts && messages.length <= 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickPromptsRow}>
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <TouchableOpacity key={i} onPress={() => handleSend(prompt)} style={styles.quickPromptChip}>
                      <Text style={styles.quickPromptText}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {showRewritePanel && (
                <GlassCard style={styles.rewritePanel}>
                  <Text style={styles.rewriteLabel}>MESSAGE REWRITER</Text>
                  <TextInput value={rewriteText} onChangeText={setRewriteText} placeholder="Paste your original message..." placeholderTextColor={colors.text_muted} multiline style={styles.rewriteInput} />
                  <View style={styles.toneRow}>
                    {REWRITE_TONES.map((t) => (
                      <TouchableOpacity key={t} onPress={() => { setRewriteTone(t); void Haptics.selectionAsync(); }} style={[styles.tonePill, rewriteTone === t && styles.tonePillSelected]}>
                        <Text style={[styles.tonePillText, rewriteTone === t && styles.tonePillTextSelected]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.rewriteActions}>
                    <GradientButton label="Rewrite" onPress={handleRewrite} small />
                    <GhostButton label="Cancel" onPress={() => setShowRewritePanel(false)} />
                  </View>
                </GlassCard>
              )}
              <View style={[styles.inputBarOuter, { marginBottom: insets.bottom > 0 ? insets.bottom : spacing.md }]}>
                {inputText.length > 0 && (
                  <Text style={styles.charCount}>{inputText.length}/{MAX_CHARS}</Text>
                )}
                <GlassCard style={styles.inputBar}>
                  <TextInput value={inputText} onChangeText={setInputText} placeholder="Type here..." placeholderTextColor={colors.text_muted} multiline maxLength={MAX_CHARS} style={styles.textInput} testID="coach-input" />
                  <TouchableOpacity onPress={() => handleSend()} disabled={!inputText.trim() || isTyping} activeOpacity={0.8}>
                    <LinearGradient colors={[colors.grad_rose_start, colors.grad_violet_end]} style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}>
                      <Ionicons name="arrow-up" size={20} color={colors.text_on_grad} />
                    </LinearGradient>
                  </TouchableOpacity>
                </GlassCard>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}
