import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColors, ThemeShadows, fontSizes, spacing, radius } from '@/constants/theme';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import GhostButton from '@/components/ui/GhostButton';
import GradientButton from '@/components/ui/GradientButton';
import GoldBadge from '@/components/ui/GoldBadge';
import GoldDivider from '@/components/ui/GoldDivider';
import ProgressBar from '@/components/ui/ProgressBar';
import HeartParticles from '@/components/ui/HeartParticles';
import LockedOverlay from '@/components/ui/LockedOverlay';
import { TESTS, TestDefinition, TestResult } from '@/mocks/tests';
import { useApp } from '@/context/AppContext';

type ScreenState = 'list' | 'quiz' | 'result';

const DIFFICULTY_MAP: Record<string, number> = { '3 min': 1, '4 min': 2, '5 min': 3, '6 min': 3 };
const DIFFICULTY_COLORS = ['#4ECDC4', '#FFD166', '#FF6B8A'];

function createStyles(c: ThemeColors, s: ThemeShadows) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
    headerTitle: { fontSize: fontSizes['2xl'], color: c.text_primary, fontWeight: '700' as const, letterSpacing: -0.5 },
    headerSub: { fontSize: fontSizes.sm, color: c.text_secondary, fontStyle: 'italic' as const, marginTop: spacing.xs },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
    featuredCard: { padding: spacing.xl, marginBottom: spacing.lg, minHeight: 130, justifyContent: 'center' as const, gap: spacing.sm },
    featuredTitle: { fontSize: fontSizes.xl, color: c.text_primary, fontWeight: '700' as const },
    featuredDetail: { fontSize: fontSizes.sm, color: c.text_secondary },
    featuredCta: { alignSelf: 'flex-start' as const, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
    testRow: { padding: spacing.md, paddingHorizontal: spacing.lg, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md, marginBottom: spacing.sm },
    testIconGradient: { width: 40, height: 40, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
    testInfo: { flex: 1 },
    testTitle: { fontSize: fontSizes.base, color: c.text_primary, fontWeight: '600' as const },
    testDesc: { fontSize: fontSizes.xs, color: c.text_secondary, marginTop: 2 },
    testRight: { alignItems: 'flex-end' as const, gap: spacing.xs },
    difficultyDots: { flexDirection: 'row' as const, gap: 3 },
    difficultyDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: c.glass_border },
    completedBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3 },
    completedText: { fontSize: fontSizes.xs, color: c.success },
    quizHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.md },
    backBtn: { padding: spacing.xs },
    quizProgress: { fontSize: fontSizes.xs, color: c.text_muted, letterSpacing: 1.5, textTransform: 'uppercase' as const },
    progressContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
    quizContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
    questionText: { fontSize: fontSizes['2xl'], color: c.text_primary, fontWeight: '600' as const, textAlign: 'center' as const, marginBottom: spacing['2xl'], lineHeight: 38 },
    answersContainer: { gap: spacing.md, marginBottom: spacing.xl },
    answerCard: { padding: spacing.lg, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    answerCardSelected: { ...s.rose_glow },
    answerText: { color: c.text_secondary, fontSize: fontSizes.base, flex: 1, marginRight: spacing.sm },
    answerTextSelected: { color: c.text_primary, fontWeight: '500' as const },
    nextBtn: { alignSelf: 'center' as const },
    resultContent: { paddingHorizontal: spacing.xl, paddingTop: spacing['2xl'], paddingBottom: spacing['3xl'], alignItems: 'center' as const },
    resultIconContainer: { marginBottom: spacing.xl },
    resultIconGradient: { width: 100, height: 100, borderRadius: 50, alignItems: 'center' as const, justifyContent: 'center' as const },
    resultTitle: { fontSize: fontSizes['3xl'], color: c.text_primary, fontWeight: '700' as const, textAlign: 'center' as const, letterSpacing: -0.5, marginBottom: spacing.sm },
    resultScore: { fontSize: fontSizes.xl, color: c.text_gold, fontWeight: '600' as const, textAlign: 'center' as const, marginBottom: spacing.lg },
    resultSummary: { fontSize: fontSizes.base, color: c.text_secondary, textAlign: 'center' as const, lineHeight: 24, maxWidth: 320 },
    fullReportSection: { width: '100%', marginBottom: spacing.xl },
    lockedReportContainer: { position: 'relative' as const, minHeight: 180, borderRadius: radius.xl, overflow: 'hidden' as const },
    reportPreview: { color: c.text_secondary, fontSize: fontSizes.base, lineHeight: 24, padding: spacing.xl },
    resultActions: { gap: spacing.md, alignItems: 'center' as const, width: '100%' },
    bottomSpacer: { height: 40 },
    sectionLabel: { fontSize: fontSizes.xs, color: c.text_muted, fontWeight: '600' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, marginBottom: spacing.sm, marginTop: spacing.lg },
  });
}

export default function TestsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { incrementTests, isPremium, openPaywall } = useApp();
  const [screenState, setScreenState] = useState<ScreenState>('list');
  const [activeTest, setActiveTest] = useState<TestDefinition | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [completedTestIds, setCompletedTestIds] = useState<string[]>([]);

  const resultBounceAnim = useRef(new Animated.Value(0)).current;
  const resultOpacityAnim = useRef(new Animated.Value(0)).current;

  const startTest = useCallback((test: TestDefinition) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveTest(test);
    setCurrentQuestion(0);
    setAnswers({});
    setSelectedAnswer('');
    setScreenState('quiz');
  }, []);

  const handleAnswer = useCallback((answerId: string) => {
    void Haptics.selectionAsync();
    setSelectedAnswer(answerId);
  }, []);

  const handleNext = useCallback(() => {
    if (!activeTest || !selectedAnswer) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const question = activeTest.questions[currentQuestion];
    const answer = question.answers.find(a => a.id === selectedAnswer);
    if (!answer) return;
    const newAnswers = { ...answers, [question.id]: answer.category };
    setAnswers(newAnswers);
    setSelectedAnswer('');
    if (currentQuestion < activeTest.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const categoryCounts: Record<string, number> = {};
      Object.values(newAnswers).forEach(cat => { categoryCounts[cat] = (categoryCounts[cat] || 0) + 1; });
      let topCategory = '';
      let topCount = 0;
      Object.entries(categoryCounts).forEach(([cat, count]) => { if (count > topCount) { topCount = count; topCategory = cat; } });
      const foundResult = activeTest.results.find(r => r.id === topCategory) || activeTest.results[0];
      setTestResult(foundResult);
      setScreenState('result');
      setCompletedTestIds(prev => prev.includes(activeTest.id) ? prev : [...prev, activeTest.id]);
      incrementTests();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resultBounceAnim.setValue(0);
      resultOpacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(resultBounceAnim, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 120 }),
        Animated.timing(resultOpacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [activeTest, currentQuestion, selectedAnswer, answers, incrementTests, resultBounceAnim, resultOpacityAnim]);

  const handleBack = useCallback(() => {
    setScreenState('list');
    setActiveTest(null);
    setTestResult(null);
  }, []);

  const handleShareResult = useCallback(async () => {
    if (!testResult || !activeTest) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const shareText = `I just took the ${activeTest.title} on LoveTestAI and got: ${testResult.label}!\n\n${testResult.summary}\n\n-- Discover yours at LoveTestAI`;
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: `My ${activeTest.title} Result`, text: shareText });
        } else {
          try { await navigator.clipboard.writeText(shareText); } catch { console.log('Copy failed'); }
          Alert.alert('Copied', 'Result copied to clipboard.');
        }
      } else {
        await Share.share({ message: shareText, title: `My ${activeTest.title} Result` });
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share') console.log('Share error:', error);
    }
  }, [testResult, activeTest]);

  const renderDifficultyDots = useCallback((duration: string) => {
    const level = DIFFICULTY_MAP[duration] || 1;
    return (
      <View style={styles.difficultyDots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.difficultyDot, i < level && { backgroundColor: DIFFICULTY_COLORS[Math.min(level - 1, 2)] }]} />
        ))}
      </View>
    );
  }, [styles]);

  if (screenState === 'quiz' && activeTest) {
    const question = activeTest.questions[currentQuestion];
    const progress = (currentQuestion + 1) / activeTest.questions.length;
    return (
      <ScreenBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text_secondary} />
            </TouchableOpacity>
            <Text style={styles.quizProgress}>QUESTION {currentQuestion + 1} OF {activeTest.questions.length}</Text>
          </View>
          <View style={styles.progressContainer}><ProgressBar progress={progress} /></View>
          <ScrollView contentContainerStyle={styles.quizContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.questionText}>{question.text}</Text>
            <View style={styles.answersContainer}>
              {question.answers.map((answer) => (
                <TouchableOpacity key={answer.id} onPress={() => handleAnswer(answer.id)} activeOpacity={0.8}>
                  <GlassCard style={[styles.answerCard, selectedAnswer === answer.id && styles.answerCardSelected]} gradient={selectedAnswer === answer.id}>
                    <Text style={[styles.answerText, selectedAnswer === answer.id && styles.answerTextSelected]}>{answer.text}</Text>
                    {selectedAnswer === answer.id && <Ionicons name="checkmark" size={20} color={colors.accent_rose} />}
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
            <GradientButton label={currentQuestion < activeTest.questions.length - 1 ? 'Next' : 'See Results'} onPress={handleNext} disabled={!selectedAnswer} style={styles.nextBtn} />
          </ScrollView>
        </View>
      </ScreenBackground>
    );
  }

  if (screenState === 'result' && testResult && activeTest) {
    const iconScale = resultBounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
    return (
      <ScreenBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <HeartParticles />
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text_secondary} />
            </TouchableOpacity>
            <Text style={styles.quizProgress}>{activeTest.title.toUpperCase()}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.resultIconContainer, { opacity: resultOpacityAnim, transform: [{ scale: iconScale }] }]}>
              <LinearGradient colors={[colors.grad_rose_start, colors.grad_violet_end]} style={styles.resultIconGradient}>
                <Ionicons name={testResult.icon as any} size={48} color={colors.text_on_grad} />
              </LinearGradient>
            </Animated.View>
            <Animated.View style={{ opacity: resultOpacityAnim }}>
              <Text style={styles.resultTitle}>{testResult.label}</Text>
              <Text style={styles.resultScore}>{activeTest.title}</Text>
              <Text style={styles.resultSummary}>{testResult.summary}</Text>
            </Animated.View>
            <GoldDivider />
            <View style={styles.fullReportSection}>
              <View style={styles.lockedReportContainer}>
                <Text style={styles.reportPreview} numberOfLines={3}>{testResult.fullReport}</Text>
                {!isPremium && <LockedOverlay title="Full Report Included in Plus" subtitle="From $8.99/mo or buy individual reports" onUpgrade={openPaywall} onRestore={openPaywall} />}
              </View>
            </View>
            <View style={styles.resultActions}>
              <GradientButton label="Share My Result" onPress={handleShareResult} />
              <GhostButton label="Try Another Test" onPress={handleBack} />
            </View>
          </ScrollView>
        </View>
      </ScreenBackground>
    );
  }

  const featuredTest = TESTS[0];
  const otherTests = TESTS.slice(1);

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tests</Text>
          <Text style={styles.headerSub}>Discover your romantic truth</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          <TouchableOpacity onPress={() => startTest(featuredTest)} activeOpacity={0.9}>
            <GlassCard style={styles.featuredCard}>
              <GoldBadge label="MOST POPULAR" />
              <Text style={styles.featuredTitle}>{featuredTest.title}</Text>
              <Text style={styles.featuredDetail}>5 languages · {featuredTest.duration} · Free</Text>
              <GhostButton label="Take Test" onPress={() => startTest(featuredTest)} style={styles.featuredCta} />
            </GlassCard>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>ALL TESTS</Text>
          {otherTests.map((test) => (
            <TouchableOpacity key={test.id} onPress={() => startTest(test)} activeOpacity={0.8}>
              <GlassCard style={styles.testRow}>
                <LinearGradient colors={[colors.grad_rose_start, colors.grad_violet_end]} style={styles.testIconGradient}>
                  <Ionicons name={test.icon as any} size={18} color={colors.text_on_grad} />
                </LinearGradient>
                <View style={styles.testInfo}>
                  <Text style={styles.testTitle}>{test.title}</Text>
                  <Text style={styles.testDesc}>{test.description}</Text>
                </View>
                <View style={styles.testRight}>
                  <GoldBadge label={test.duration} />
                  {renderDifficultyDots(test.duration)}
                  {completedTestIds.includes(test.id) && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                      <Text style={styles.completedText}>Done</Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </ScreenBackground>
  );
}
