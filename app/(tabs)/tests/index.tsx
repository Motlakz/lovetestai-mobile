import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Share,
  TextInput,
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
import SelectField from '@/components/ui/SelectField';
import DatePickerField from '@/components/ui/DatePickerField';
import { ALL_TESTS, LOVE_LANGUAGE_QUESTIONS, LOVE_LANGUAGE_RESULTS, ATTACHMENT_STYLES, LL_TO_ATTACHMENT, LOVE_QUIZ_QUESTIONS, LQ_ANSWER_CHOICES, CalculatorTest, LLResult, AttachmentStyle, LQQuestion } from '@/mocks/tests';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/ui/Toast';
import {
  calculateZodiacCompatibility,
  calculateBirthdateCompatibility,
  calculateLoveScore,
  calculateNumerology,
  findSoulmate,
  analyzeLoveCompatibility,
} from '@/services/aiService';

type ScreenState = 'list' | 'quiz' | 'll-result' | 'calculator' | 'lq-questions' | 'calc-result';

const DIFFICULTY_MAP: Record<string, number> = { '1 min': 1, '2 min': 2, '3 min': 3, '4 min': 3, '5 min': 3 };
const DIFFICULTY_COLORS = ['#4ECDC4', '#FFD166', '#FF6B8A'];

const ZODIAC_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const RELATIONSHIP_STATUSES = ['Single (Crushing)', 'Dating', 'In a Relationship', 'Engaged', 'Married'];
const LOVE_LANGUAGES = ['Words of Affirmation', 'Physical Touch', 'Quality Time', 'Receiving Gifts', 'Acts of Service'];
const INTEREST_OPTIONS = ['Travel', 'Music', 'Art', 'Fitness', 'Cooking', 'Reading', 'Nature', 'Film', 'Creativity', 'Adventure'];

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
    testRow: { padding: spacing.lg, paddingHorizontal: spacing.lg, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md, marginBottom: spacing.md, minHeight: 84 },
    testIconGradient: { width: 52, height: 52, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const },
    testInfo: { flex: 1, gap: 4 },
    testTitle: { fontSize: fontSizes.md, color: c.text_primary, fontWeight: '600' as const },
    testDesc: { fontSize: fontSizes.sm, color: c.text_secondary, lineHeight: 18 },
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
    calcContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
    calcTitle: { fontSize: fontSizes['2xl'], color: c.text_primary, fontWeight: '700' as const, marginBottom: spacing.xs },
    calcSub: { fontSize: fontSizes.sm, color: c.text_secondary, marginBottom: spacing.xl },
    calcLabel: { fontSize: fontSizes.sm, color: c.text_secondary, fontWeight: '500' as const, marginBottom: spacing.sm, marginTop: spacing.md },
    calcInput: { backgroundColor: c.bg_elevated, borderWidth: 1, borderColor: c.glass_border, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: c.text_primary, fontSize: fontSizes.base },
    calcResultCard: { padding: spacing.xl, marginBottom: spacing.xl },
    calcScoreRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: spacing.md, marginBottom: spacing.lg },
    calcScoreNum: { fontSize: fontSizes['3xl'], color: c.text_gold, fontWeight: '700' as const },
    calcScoreLabel: { fontSize: fontSizes.sm, color: c.text_muted },
    calcResultText: { fontSize: fontSizes.base, color: c.text_secondary, lineHeight: 26 },
    calcResultActions: { gap: spacing.md, alignItems: 'center' as const },
    attachmentCard: { padding: spacing.lg, width: '100%', marginBottom: spacing.xl, flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: spacing.md },
    attachmentIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const },
    attachmentInfo: { flex: 1 },
    attachmentLabel: { fontSize: fontSizes.xs, color: c.text_muted, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: spacing.xs },
    attachmentTitle: { fontSize: fontSizes.base, color: c.text_primary, fontWeight: '600' as const, marginBottom: spacing.xs },
    attachmentSummary: { fontSize: fontSizes.sm, color: c.text_secondary, lineHeight: 20 },
  });
}

export default function TestsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { incrementTests } = useApp();
  const toast = useToast();
  const [screenState, setScreenState] = useState<ScreenState>('list');

  // Love language quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [llResult, setLlResult] = useState<LLResult | null>(null);
  const [attachmentResult, setAttachmentResult] = useState<AttachmentStyle | null>(null);
  const [completedLL, setCompletedLL] = useState(false);

  // Calculator state
  const [activeCalcTest, setActiveCalcTest] = useState<CalculatorTest | null>(null);
  const [calcInput1, setCalcInput1] = useState('');
  const [calcInput2, setCalcInput2] = useState('');
  const [calcInput3, setCalcInput3] = useState('');
  const [calcInput4, setCalcInput4] = useState('');
  const [soulmateInterests, setSoulmateInterests] = useState<string[]>([]);
  const [lqQuestions, setLqQuestions] = useState<LQQuestion[]>([]);
  const [lqCurrentQ, setLqCurrentQ] = useState(0);
  const [lqAnswers, setLqAnswers] = useState<number[]>([]);
  const [lqCompatibility, setLqCompatibility] = useState(50);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcResult, setCalcResult] = useState<{ score?: number; text: string } | null>(null);

  const resultBounceAnim = useRef(new Animated.Value(0)).current;
  const resultOpacityAnim = useRef(new Animated.Value(0)).current;

  const startLLQuiz = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentQuestion(0);
    setAnswers({});
    setSelectedAnswer('');
    setLlResult(null);
    setScreenState('quiz');
  }, []);

  const startCalculator = useCallback((test: CalculatorTest) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveCalcTest(test);
    setCalcInput1('');
    setCalcInput2('');
    setCalcInput3('');
    setCalcInput4('');
    setSoulmateInterests([]);
    setCalcResult(null);
    setScreenState('calculator');
  }, []);

  const handleCalcSubmit = useCallback(async () => {
    if (!activeCalcTest) return;
    const { calculatorType } = activeCalcTest;

    if (calculatorType === 'zodiac' && (!calcInput1 || !calcInput2)) {
      toast.warning('Select your sign and your partner\'s sign.');
      return;
    }
    if (calculatorType === 'birthdate' && (!calcInput1 || !calcInput2)) {
      toast.warning('Please select both birth dates.');
      return;
    }
    if (calculatorType === 'love-score' && (!calcInput1 || !calcInput2 || !calcInput4)) {
      toast.warning('Please enter both names and relationship status.');
      return;
    }
    if (calculatorType === 'love-quiz' && (!calcInput1 || !calcInput2 || !calcInput3 || !calcInput4)) {
      toast.warning('Please enter both names and love languages.');
      return;
    }
    if (calculatorType === 'numerology' && (!calcInput1 || !calcInput2 || !calcInput3 || !calcInput4)) {
      toast.warning('Please enter both names and birth dates.');
      return;
    }
    if (calculatorType === 'soulmate' && (!calcInput1 || !calcInput3 || !calcInput4)) {
      toast.warning('Please enter your name, zodiac sign, and love language.');
      return;
    }

    if (calculatorType === 'love-quiz') {
      const shuffled = [...LOVE_QUIZ_QUESTIONS].sort(() => 0.5 - Math.random());
      setLqQuestions(shuffled.slice(0, 10));
      setLqCurrentQ(0);
      setLqAnswers([]);
      setLqCompatibility(50);
      setScreenState('lq-questions');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCalcLoading(true);
    try {
      if (calculatorType === 'zodiac') {
        const data = await calculateZodiacCompatibility(calcInput1, calcInput2);
        setCalcResult({ score: data.score, text: data.analysis });
      } else if (calculatorType === 'birthdate') {
        const data = await calculateBirthdateCompatibility(calcInput1, calcInput2);
        setCalcResult({ score: data.score, text: data.analysis });
      } else if (calculatorType === 'love-score') {
        const data = await calculateLoveScore(calcInput1, calcInput2, calcInput4 || 'Dating', calcInput3);
        setCalcResult({ score: data.score, text: `${data.insight}\n\n${data.message}` });
      } else if (calculatorType === 'numerology') {
        const data = await calculateNumerology(calcInput1, calcInput2, calcInput3, calcInput4);
        setCalcResult({ score: data.score, text: data.analysis });
      } else if (calculatorType === 'soulmate') {
        const data = await findSoulmate({
          name: calcInput1,
          birthday: calcInput2 || '',
          zodiacSign: calcInput3,
          interests: soulmateInterests.length > 0 ? soulmateInterests : ['connection', 'love'],
          loveLanguage: calcInput4,
        });
        setCalcResult({ text: `${data.analysis}\n\n${data.traits.map(t => `• ${t}`).join('\n')}` });
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScreenState('calc-result');
    } catch {
      toast.error('Could not connect. Check your connection and try again.');
    } finally {
      setCalcLoading(false);
    }
  }, [activeCalcTest, calcInput1, calcInput2, calcInput3, calcInput4, soulmateInterests, toast]);

  const handleAnswer = useCallback((answerId: string) => {
    void Haptics.selectionAsync();
    setSelectedAnswer(answerId);
  }, []);

  const handleNext = useCallback(() => {
    if (!selectedAnswer) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const question = LOVE_LANGUAGE_QUESTIONS[currentQuestion];
    const answer = question.answers.find(a => a.id === selectedAnswer);
    if (!answer) return;
    const newAnswers = { ...answers, [question.id]: answer.category };
    setAnswers(newAnswers);
    setSelectedAnswer('');
    if (currentQuestion < LOVE_LANGUAGE_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const categoryCounts: Record<string, number> = {};
      Object.values(newAnswers).forEach(cat => { categoryCounts[cat] = (categoryCounts[cat] || 0) + 1; });
      let topCategory = '';
      let topCount = 0;
      Object.entries(categoryCounts).forEach(([cat, count]) => { if (count > topCount) { topCount = count; topCategory = cat; } });
      const result = LOVE_LANGUAGE_RESULTS[topCategory] || LOVE_LANGUAGE_RESULTS['words'];
      const attachmentId = LL_TO_ATTACHMENT[topCategory] ?? 'secure';
      setLlResult(result);
      setAttachmentResult(ATTACHMENT_STYLES[attachmentId] ?? null);
      setCompletedLL(true);
      setScreenState('ll-result');
      incrementTests();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resultBounceAnim.setValue(0);
      resultOpacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(resultBounceAnim, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 120 }),
        Animated.timing(resultOpacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [currentQuestion, selectedAnswer, answers, incrementTests, resultBounceAnim, resultOpacityAnim]);

  const handleBack = useCallback(() => {
    setScreenState('list');
    setLlResult(null);
    setAttachmentResult(null);
    setActiveCalcTest(null);
    setCalcResult(null);
  }, []);

  const handleShareLLResult = useCallback(async () => {
    if (!llResult) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const shareText = `I just discovered my love language on Love Test AI: ${llResult.label}!\n\n${llResult.summary}\n\n— Find yours at Love Test AI`;
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: 'My Love Language', text: shareText });
        } else {
          try { await navigator.clipboard.writeText(shareText); } catch { console.log('Copy failed'); }
          toast.success('Result copied to clipboard.');
        }
      } else {
        await Share.share({ message: shareText, title: 'My Love Language' });
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share') console.log('Share error:', error);
    }
  }, [llResult, toast]);

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

  const handleLQAnswer = useCallback(async (score: number) => {
    void Haptics.selectionAsync();
    const newAnswers = [...lqAnswers, score];
    const newCompat = Math.min(100, Math.max(0, lqCompatibility + (score - 3) * 5));
    setLqCompatibility(newCompat);
    setLqAnswers(newAnswers);

    if (lqCurrentQ < lqQuestions.length - 1) {
      setLqCurrentQ(lqCurrentQ + 1);
    } else {
      const total = newAnswers.reduce((s, c) => s + c, 0);
      const finalScore = Math.round((total / (lqQuestions.length * 5)) * 100);
      setCalcLoading(true);
      try {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const data = await analyzeLoveCompatibility(calcInput1, calcInput2, calcInput3, calcInput4, finalScore);
        setCalcResult({ score: data.adjustedScore, text: data.result });
        incrementTests();
      } catch {
        setCalcResult({ score: finalScore, text: 'Could not get a reading right now. Your score reflects the quiz answers directly.' });
        incrementTests();
      } finally {
        setCalcLoading(false);
        setScreenState('calc-result');
      }
    }
  }, [lqAnswers, lqCurrentQ, lqQuestions, lqCompatibility, calcInput1, calcInput2, calcInput3, calcInput4, incrementTests]);

  // ── Quiz screen ──────────────────────────────────────────────────────────────
  if (screenState === 'quiz') {
    const question = LOVE_LANGUAGE_QUESTIONS[currentQuestion];
    const progress = (currentQuestion + 1) / LOVE_LANGUAGE_QUESTIONS.length;
    return (
      <ScreenBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text_secondary} />
            </TouchableOpacity>
            <Text style={styles.quizProgress}>QUESTION {currentQuestion + 1} OF {LOVE_LANGUAGE_QUESTIONS.length}</Text>
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
            <GradientButton
              label={currentQuestion < LOVE_LANGUAGE_QUESTIONS.length - 1 ? 'Next' : 'See Results'}
              onPress={handleNext}
              disabled={!selectedAnswer}
              style={styles.nextBtn}
            />
          </ScrollView>
        </View>
      </ScreenBackground>
    );
  }

  // ── Love language result screen ──────────────────────────────────────────────
  if (screenState === 'll-result' && llResult) {
    const iconScale = resultBounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
    return (
      <ScreenBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <HeartParticles />
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text_secondary} />
            </TouchableOpacity>
            <Text style={styles.quizProgress}>LOVE LANGUAGE TEST</Text>
          </View>
          <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.resultIconContainer, { opacity: resultOpacityAnim, transform: [{ scale: iconScale }] }]}>
              <LinearGradient colors={[colors.grad_rose_start, colors.grad_violet_end]} style={styles.resultIconGradient}>
                <Ionicons name={llResult.icon as any} size={48} color={colors.text_on_grad} />
              </LinearGradient>
            </Animated.View>
            <Animated.View style={{ opacity: resultOpacityAnim }}>
              <Text style={styles.resultTitle}>{llResult.label}</Text>
              <Text style={styles.resultScore}>Your Primary Love Language</Text>
              <Text style={styles.resultSummary}>{llResult.summary}</Text>
            </Animated.View>
            <GoldDivider />
            {attachmentResult && (
              <GlassCard style={styles.attachmentCard}>
                <LinearGradient colors={[colors.grad_violet_start, colors.grad_rose_end]} style={styles.attachmentIcon}>
                  <Ionicons name={attachmentResult.icon as any} size={20} color={colors.text_on_grad} />
                </LinearGradient>
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentLabel}>Attachment Style Insight</Text>
                  <Text style={styles.attachmentTitle}>{attachmentResult.label}</Text>
                  <Text style={styles.attachmentSummary}>{attachmentResult.summary}</Text>
                </View>
              </GlassCard>
            )}
            <View style={styles.fullReportSection}>
              <View style={styles.lockedReportContainer}>
                <Text style={styles.reportPreview}>{llResult.fullReport}</Text>
              </View>
            </View>
            <View style={styles.resultActions}>
              <GradientButton label="Share My Result" onPress={handleShareLLResult} />
              <GhostButton label="Try Another Test" onPress={handleBack} />
            </View>
          </ScrollView>
        </View>
      </ScreenBackground>
    );
  }

  // ── Love Quiz questions screen ───────────────────────────────────────────────
  if (screenState === 'lq-questions' && lqQuestions.length > 0) {
    if (calcLoading) {
      return (
        <ScreenBackground>
          <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
            <HeartParticles />
            <LinearGradient colors={[colors.grad_rose_start, colors.grad_violet_end]} style={styles.resultIconGradient}>
              <Ionicons name="heart" size={48} color={colors.text_on_grad} />
            </LinearGradient>
            <Text style={[styles.quizProgress, { marginTop: spacing.xl, textAlign: 'center' }]}>ANALYSING YOUR COMPATIBILITY…</Text>
          </View>
        </ScreenBackground>
      );
    }
    const question = lqQuestions[lqCurrentQ];
    const choices = LQ_ANSWER_CHOICES[question.type];
    const progress = (lqCurrentQ / lqQuestions.length) * 100;
    return (
      <ScreenBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text_secondary} />
            </TouchableOpacity>
            <Text style={styles.quizProgress}>QUESTION {lqCurrentQ + 1} OF {lqQuestions.length}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="heart" size={10} color={colors.accent_rose} />
              <Text style={[styles.quizProgress, { color: colors.accent_rose }]}>{lqCompatibility}%</Text>
            </View>
          </View>
          <View style={styles.progressContainer}><ProgressBar progress={progress / 100} /></View>
          <ScrollView contentContainerStyle={styles.quizContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.questionText}>{question.text}</Text>
            <View style={styles.answersContainer}>
              {choices.map((choice, i) => (
                <TouchableOpacity key={i} onPress={() => handleLQAnswer(i + 1)} activeOpacity={0.8}>
                  <GlassCard style={styles.answerCard}>
                    <Text style={styles.answerText}>{choice}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.text_muted} />
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScreenBackground>
    );
  }

  // ── Calculator input screen ──────────────────────────────────────────────────
  if (screenState === 'calculator' && activeCalcTest) {
    const { calculatorType } = activeCalcTest;
    const isZodiac = calculatorType === 'zodiac';
    const isBirthdate = calculatorType === 'birthdate';
    const isLoveScore = calculatorType === 'love-score';
    const isNumerology = calculatorType === 'numerology';
    const isSoulmate = calculatorType === 'soulmate';

    const isLoveQuiz = calculatorType === 'love-quiz';
    const canSubmit = isBirthdate
      ? (calcInput1 !== '' && calcInput2 !== '')
      : isNumerology
        ? (calcInput1 !== '' && calcInput2 !== '' && calcInput3 !== '' && calcInput4 !== '')
        : isSoulmate
          ? (calcInput1 !== '' && calcInput3 !== '' && calcInput4 !== '')
          : isLoveScore
            ? (calcInput1 !== '' && calcInput2 !== '' && calcInput4 !== '')
            : isLoveQuiz
              ? (calcInput1 !== '' && calcInput2 !== '' && calcInput3 !== '' && calcInput4 !== '')
              : (calcInput1 !== '' && calcInput2 !== '');

    return (
      <ScreenBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={() => setScreenState('list')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text_secondary} />
            </TouchableOpacity>
            <Text style={styles.quizProgress}>{activeCalcTest.title.toUpperCase()}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.calcContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.calcTitle}>{activeCalcTest.title}</Text>
            <Text style={styles.calcSub}>{activeCalcTest.description}</Text>

            {isZodiac && (<>
              <SelectField label="Your Zodiac Sign" value={calcInput1} onChange={setCalcInput1} options={ZODIAC_SIGNS} placeholder="Choose your sign" />
              <SelectField label="Their Zodiac Sign" value={calcInput2} onChange={setCalcInput2} options={ZODIAC_SIGNS} placeholder="Choose their sign" />
            </>)}

            {isBirthdate && (<>
              <DatePickerField label="Your Birthdate" value={calcInput1} onChange={setCalcInput1} />
              <DatePickerField label="Their Birthdate" value={calcInput2} onChange={setCalcInput2} />
            </>)}

            {isLoveScore && (<>
              <Text style={styles.calcLabel}>Your name</Text>
              <TextInput style={styles.calcInput} value={calcInput1} onChangeText={setCalcInput1} placeholder="Your first name" placeholderTextColor={colors.text_muted} />
              <Text style={styles.calcLabel}>Their name</Text>
              <TextInput style={styles.calcInput} value={calcInput2} onChangeText={setCalcInput2} placeholder="Their first name" placeholderTextColor={colors.text_muted} />
              <SelectField label="Relationship Status" value={calcInput4} onChange={setCalcInput4} options={RELATIONSHIP_STATUSES} placeholder="Select your status" />
              <Text style={styles.calcLabel}>Time together</Text>
              <TextInput style={styles.calcInput} value={calcInput3} onChangeText={setCalcInput3} placeholder="e.g. 2 years, 3 months…" placeholderTextColor={colors.text_muted} />
            </>)}

            {isLoveQuiz && (<>
              <Text style={styles.calcLabel}>Your name</Text>
              <TextInput style={styles.calcInput} value={calcInput1} onChangeText={setCalcInput1} placeholder="e.g. Sophia" placeholderTextColor={colors.text_muted} />
              <Text style={styles.calcLabel}>Their name</Text>
              <TextInput style={styles.calcInput} value={calcInput2} onChangeText={setCalcInput2} placeholder="e.g. Liam" placeholderTextColor={colors.text_muted} />
              <SelectField label="Your Love Language" value={calcInput3} onChange={setCalcInput3} options={LOVE_LANGUAGES} placeholder="Select your love language" />
              <SelectField label="Their Love Language" value={calcInput4} onChange={setCalcInput4} options={LOVE_LANGUAGES} placeholder="Select their love language" />
            </>)}

            {isNumerology && (<>
              <Text style={styles.calcLabel}>Your full name</Text>
              <TextInput style={styles.calcInput} value={calcInput1} onChangeText={setCalcInput1} placeholder="Your full name" placeholderTextColor={colors.text_muted} />
              <Text style={styles.calcLabel}>Their full name</Text>
              <TextInput style={styles.calcInput} value={calcInput2} onChangeText={setCalcInput2} placeholder="Their full name" placeholderTextColor={colors.text_muted} />
              <DatePickerField label="Your Birthdate" value={calcInput3} onChange={setCalcInput3} />
              <DatePickerField label="Their Birthdate" value={calcInput4} onChange={setCalcInput4} />
            </>)}

            {isSoulmate && (<>
              <Text style={styles.calcLabel}>Your name</Text>
              <TextInput style={styles.calcInput} value={calcInput1} onChangeText={setCalcInput1} placeholder="Your first name" placeholderTextColor={colors.text_muted} />
              <DatePickerField label="Your Birthday" value={calcInput2} onChange={setCalcInput2} />
              <SelectField label="Your Zodiac Sign" value={calcInput3} onChange={setCalcInput3} options={ZODIAC_SIGNS} placeholder="Choose your sign" />
              <SelectField label="Your Love Language" value={calcInput4} onChange={setCalcInput4} options={LOVE_LANGUAGES} placeholder="Select your love language" />
              <SelectField
                label="Your Main Interest"
                value={soulmateInterests[0] ?? ''}
                onChange={(value) => setSoulmateInterests([value])}
                options={INTEREST_OPTIONS}
                placeholder="Choose an interest"
              />
            </>)}

            <GradientButton
              label={calcLoading ? 'Loading…' : isLoveQuiz ? 'Start Quiz' : 'Get Reading'}
              onPress={handleCalcSubmit}
              disabled={!canSubmit || calcLoading}
            />
          </ScrollView>
        </View>
      </ScreenBackground>
    );
  }

  // ── Calculator result screen ─────────────────────────────────────────────────
  if (screenState === 'calc-result' && calcResult && activeCalcTest) {
    return (
      <ScreenBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <HeartParticles />
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={() => setScreenState('list')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text_secondary} />
            </TouchableOpacity>
            <Text style={styles.quizProgress}>{activeCalcTest.title.toUpperCase()}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
            <View style={styles.resultIconContainer}>
              <LinearGradient colors={[colors.grad_rose_start, colors.grad_violet_end]} style={styles.resultIconGradient}>
                <Ionicons name={activeCalcTest.icon as any} size={48} color={colors.text_on_grad} />
              </LinearGradient>
            </View>
            {calcResult.score !== undefined && (
              <View style={styles.calcScoreRow}>
                <Text style={styles.calcScoreNum}>{calcResult.score}%</Text>
                <Text style={styles.calcScoreLabel}>Compatibility</Text>
              </View>
            )}
            <GoldDivider />
            <GlassCard style={styles.calcResultCard}>
              <Text style={styles.calcResultText}>{calcResult.text}</Text>
            </GlassCard>
            <View style={styles.calcResultActions}>
              <GhostButton label="Try Another" onPress={() => setScreenState('list')} />
            </View>
          </ScrollView>
        </View>
      </ScreenBackground>
    );
  }

  // ── List screen ──────────────────────────────────────────────────────────────
  const llEntry = ALL_TESTS[0] as any;
  const calcTests = ALL_TESTS.filter((t): t is { kind: 'calculator' } & CalculatorTest => t.kind === 'calculator');

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Love Tests</Text>
          <Text style={styles.headerSub}>Discover your romantic truth</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          <TouchableOpacity onPress={startLLQuiz} activeOpacity={0.9}>
            <GlassCard style={styles.featuredCard}>
              <GoldBadge label="MOST POPULAR" />
              <Text style={styles.featuredTitle}>{llEntry.title}</Text>
              <Text style={styles.featuredDetail}>5 languages · {llEntry.duration} · Free</Text>
              {completedLL && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              )}
              <GhostButton label="Take Test" onPress={startLLQuiz} style={styles.featuredCta} />
            </GlassCard>
          </TouchableOpacity>

          {calcTests.map((test) => (
            <TouchableOpacity key={test.id} onPress={() => startCalculator(test)} activeOpacity={0.8}>
              <GlassCard style={styles.testRow}>
                <LinearGradient colors={[colors.grad_violet_start, colors.grad_rose_end]} style={styles.testIconGradient}>
                  <Ionicons name={test.icon as any} size={24} color={colors.text_on_grad} />
                </LinearGradient>
                <View style={styles.testInfo}>
                  <Text style={styles.testTitle}>{test.title}</Text>
                  <Text style={styles.testDesc}>{test.description}</Text>
                </View>
                <View style={styles.testRight}>
                  <GoldBadge label={test.duration} />
                  {renderDifficultyDots(test.duration)}
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
