import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { getItem, setItem } from '@/services/storage';

export interface Profile {
  name: string;
  relationshipStatus: string;
  dateOfBirth: string;
  intent: string;
  apiKey: string;
}

export type SubscriptionPlan = 'free' | 'generator_unlimited' | 'premium_plus' | 'premium_couples' | 'lifetime';

export type IAPProduct = 
  | 'credit_pack_5'
  | 'premium_card_single'
  | 'premium_card_all'
  | 'report_zodiac'
  | 'report_numerology'
  | 'report_soulmate'
  | 'report_attachment'
  | 'test_love_personality'
  | 'bundle_starter'
  | 'bundle_growth'
  | 'bundle_complete'
  | 'prompt_deck';

export interface IAPProductInfo {
  id: IAPProduct;
  name: string;
  price: string;
  description: string;
  category: 'credits' | 'reports' | 'bundles' | 'exports';
}

export interface SavedCreation {
  id: string;
  type: string;
  content: string;
  toName: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  promptText: string;
  entry: string;
  date: string;
}

export interface SavedPrompt {
  id: string;
  text: string;
  savedAt: string;
}

export interface StreakData {
  streak: number;
  lastCompleted: string;
  completedDays: string[];
}

interface MonthlyCounter {
  count: number;
  resetDate: string;
}

const PLAN_DETAILS: Record<SubscriptionPlan, { label: string; price: string; monthlyPrice: string; description: string; features: string[] }> = {
  free: { label: 'Free', price: '$0', monthlyPrice: '$0', description: 'Basic access', features: ['3 AI generations/month', 'Basic test results', 'Daily prompts', 'Streak tracking'] },
  generator_unlimited: { label: 'Unlimited', price: '$3.99/mo', monthlyPrice: '$3.99', description: 'Unlimited AI generations', features: ['Unlimited AI generations', 'No watermark on exports', 'All export styles', 'Priority generation'] },
  premium_plus: { label: 'Premium Plus', price: '$8.99/mo', monthlyPrice: '$8.99', description: 'Full creative suite', features: ['Unlimited AI generations', 'AI Relationship Coach', 'All test reports unlocked', 'All PDF reports included', 'Premium card exports'] },
  premium_couples: { label: 'Couples', price: '$14.99/mo', monthlyPrice: '$14.99', description: 'Everything for two', features: ['Everything in Plus', 'Partner Mode access', 'Joint daily prompts', 'Weekly couple summary', 'Shared prompt deck'] },
  lifetime: { label: 'Lifetime', price: '$79.99', monthlyPrice: 'one-time', description: 'Pay once, love forever', features: ['Everything in Couples', 'Lifetime access', 'All future features', 'No recurring charges', 'Priority support'] },
};

const IAP_PRODUCTS: IAPProductInfo[] = [
  { id: 'credit_pack_5', name: '5 AI Credits', price: '$0.99', description: '5 additional AI generations', category: 'credits' },
  { id: 'premium_card_single', name: 'Premium Card Export', price: '$0.50', description: 'Export one creation as premium card', category: 'exports' },
  { id: 'premium_card_all', name: 'All Export Styles', price: '$0.99', description: 'Unlock all export card styles', category: 'exports' },
  { id: 'test_love_personality', name: 'Love Personality Unlock', price: '$3.99', description: 'Full Love Personality Test report', category: 'reports' },
  { id: 'report_zodiac', name: 'Zodiac Compatibility', price: '$4.99', description: 'Full Zodiac Compatibility PDF report', category: 'reports' },
  { id: 'report_numerology', name: 'Numerology Life Report', price: '$4.99', description: 'Full Numerology Love PDF report', category: 'reports' },
  { id: 'report_soulmate', name: 'Soulmate Profile', price: '$4.99', description: 'Detailed Soulmate Profile document', category: 'reports' },
  { id: 'report_attachment', name: 'Attachment Style Report', price: '$3.99', description: 'Love Personality & Attachment report', category: 'reports' },
  { id: 'prompt_deck', name: 'Couples Prompt Deck', price: '$4.99', description: '50 premium conversation prompts', category: 'reports' },
  { id: 'bundle_starter', name: 'Starter Bundle', price: '$14.99', description: 'Prompt Deck + Soulmate Kit', category: 'bundles' },
  { id: 'bundle_growth', name: 'Growth Bundle', price: '$29.99', description: 'Starter + Zodiac + Numerology', category: 'bundles' },
  { id: 'bundle_complete', name: 'Complete Bundle', price: '$49.99', description: 'All reports & kits included', category: 'bundles' },
];

function isCurrentMonth(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export const [AppProvider, useApp] = createContextHook(() => {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<Profile>({
    name: '',
    relationshipStatus: '',
    dateOfBirth: '',
    intent: '',
    apiKey: '',
  });
  const [savedCreations, setSavedCreations] = useState<SavedCreation[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [completedTests, setCompletedTests] = useState<number>(0);
  const [streakData, setStreakData] = useState<StreakData>({
    streak: 0,
    lastCompleted: '',
    completedDays: [],
  });
  const [monthlyGenerations, setMonthlyGenerations] = useState<MonthlyCounter>({
    count: 0,
    resetDate: new Date().toISOString(),
  });
  const [monthlyCoachSessions, setMonthlyCoachSessions] = useState<MonthlyCounter>({
    count: 0,
    resetDate: new Date().toISOString(),
  });
  const [todayPromptIndex, setTodayPromptIndex] = useState<number>(0);
  const [subscription, setSubscription] = useState<SubscriptionPlan>('free');
  const [purchasedIAPs, setPurchasedIAPs] = useState<IAPProduct[]>([]);
  const [bonusCredits, setBonusCredits] = useState<number>(0);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [paywallContext, setPaywallContext] = useState<string>('general');

  const initQuery = useQuery({
    queryKey: ['app-init'],
    queryFn: async () => {
      const [ob, prof, saved, journal, streak, gens, coach, prompts, tests, sub, iaps, bonus] = await Promise.all([
        getItem<boolean>('onboarding_complete'),
        getItem<Profile>('profile'),
        getItem<SavedCreation[]>('saved_creations'),
        getItem<JournalEntry[]>('journal_entries'),
        getItem<StreakData>('streak_data'),
        getItem<MonthlyCounter>('monthly_generations'),
        getItem<MonthlyCounter>('monthly_coach_sessions'),
        getItem<SavedPrompt[]>('saved_prompts'),
        getItem<number>('completed_tests'),
        getItem<SubscriptionPlan>('subscription_plan'),
        getItem<IAPProduct[]>('purchased_iaps'),
        getItem<number>('bonus_credits'),
      ]);
      return { ob, prof, saved, journal, streak, gens, coach, prompts, tests, sub, iaps, bonus };
    },
  });

  useEffect(() => {
    if (initQuery.data) {
      const { ob, prof, saved, journal, streak, gens, coach, prompts, tests, sub, iaps, bonus } = initQuery.data;
      setOnboardingComplete(ob ?? false);
      if (prof) setProfile(prof);
      if (saved) setSavedCreations(saved);
      if (journal) setJournalEntries(journal);
      if (streak) setStreakData(streak);

      if (gens && isCurrentMonth(gens.resetDate)) {
        setMonthlyGenerations(gens);
      } else {
        const reset = { count: 0, resetDate: new Date().toISOString() };
        setMonthlyGenerations(reset);
        setItem('monthly_generations', reset);
      }

      if (coach && isCurrentMonth(coach.resetDate)) {
        setMonthlyCoachSessions(coach);
      } else {
        const reset = { count: 0, resetDate: new Date().toISOString() };
        setMonthlyCoachSessions(reset);
        setItem('monthly_coach_sessions', reset);
      }

      if (prompts) setSavedPrompts(prompts);
      if (tests) setCompletedTests(tests);
      if (sub) setSubscription(sub);
      if (iaps) setPurchasedIAPs(iaps);
      if (bonus) setBonusCredits(bonus);

      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      );
      setTodayPromptIndex(dayOfYear % 30);
    }
  }, [initQuery.data]);

  const { mutate: mutateCompleteOnboarding } = useMutation({
    mutationFn: async () => {
      await setItem('onboarding_complete', true);
      return true;
    },
    onSuccess: () => {
      setOnboardingComplete(true);
    },
  });

  const { mutate: mutateUpdateProfile } = useMutation({
    mutationFn: async (newProfile: Profile) => {
      await setItem('profile', newProfile);
      return newProfile;
    },
    onSuccess: (data) => {
      setProfile(data);
    },
  });

  const { mutate: mutateSaveCreation } = useMutation({
    mutationFn: async (creation: SavedCreation) => {
      const updated = [creation, ...savedCreations];
      await setItem('saved_creations', updated);
      return updated;
    },
    onSuccess: (data) => {
      setSavedCreations(data);
    },
  });

  const { mutate: mutateDeleteCreation } = useMutation({
    mutationFn: async (id: string) => {
      const updated = savedCreations.filter(c => c.id !== id);
      await setItem('saved_creations', updated);
      return updated;
    },
    onSuccess: (data) => {
      setSavedCreations(data);
    },
  });

  const { mutate: mutateIncrementGenerations } = useMutation({
    mutationFn: async () => {
      const updated = { count: monthlyGenerations.count + 1, resetDate: monthlyGenerations.resetDate };
      await setItem('monthly_generations', updated);
      return updated;
    },
    onSuccess: (data) => {
      setMonthlyGenerations(data);
    },
  });

  const { mutate: mutateIncrementCoachSessions } = useMutation({
    mutationFn: async () => {
      const updated = { count: monthlyCoachSessions.count + 1, resetDate: monthlyCoachSessions.resetDate };
      await setItem('monthly_coach_sessions', updated);
      return updated;
    },
    onSuccess: (data) => {
      setMonthlyCoachSessions(data);
    },
  });

  const { mutate: mutateSavePrompt } = useMutation({
    mutationFn: async (prompt: SavedPrompt) => {
      const updated = [prompt, ...savedPrompts];
      await setItem('saved_prompts', updated);
      return updated;
    },
    onSuccess: (data) => {
      setSavedPrompts(data);
    },
  });

  const { mutate: mutateDeleteSavedPrompt } = useMutation({
    mutationFn: async (id: string) => {
      const updated = savedPrompts.filter(p => p.id !== id);
      await setItem('saved_prompts', updated);
      return updated;
    },
    onSuccess: (data) => {
      setSavedPrompts(data);
    },
  });

  const { mutate: mutateDeleteJournalEntry } = useMutation({
    mutationFn: async (id: string) => {
      const updated = journalEntries.filter(e => e.id !== id);
      await setItem('journal_entries', updated);
      return updated;
    },
    onSuccess: (data) => {
      setJournalEntries(data);
    },
  });

  const { mutate: mutateIncrementTests } = useMutation({
    mutationFn: async () => {
      const updated = completedTests + 1;
      await setItem('completed_tests', updated);
      return updated;
    },
    onSuccess: (data) => {
      setCompletedTests(data);
    },
  });

  const { mutate: mutateSetSubscription } = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      await setItem('subscription_plan', plan);
      return plan;
    },
    onSuccess: (plan) => {
      setSubscription(plan);
    },
  });

  const { mutate: mutateResetApp } = useMutation({
    mutationFn: async () => {
      await Promise.all([
        setItem('onboarding_complete', false),
        setItem('profile', { name: '', relationshipStatus: '', dateOfBirth: '', intent: '', apiKey: '' }),
        setItem('saved_creations', []),
        setItem('journal_entries', []),
        setItem('streak_data', { streak: 0, lastCompleted: '', completedDays: [] }),
        setItem('monthly_generations', { count: 0, resetDate: new Date().toISOString() }),
        setItem('monthly_coach_sessions', { count: 0, resetDate: new Date().toISOString() }),
        setItem('saved_prompts', []),
        setItem('completed_tests', 0),
        setItem('subscription_plan', 'free'),
        setItem('purchased_iaps', []),
        setItem('bonus_credits', 0),
      ]);
      return true;
    },
    onSuccess: () => {
      setOnboardingComplete(false);
      setProfile({ name: '', relationshipStatus: '', dateOfBirth: '', intent: '', apiKey: '' });
      setSavedCreations([]);
      setJournalEntries([]);
      setSavedPrompts([]);
      setCompletedTests(0);
      setStreakData({ streak: 0, lastCompleted: '', completedDays: [] });
      setMonthlyGenerations({ count: 0, resetDate: new Date().toISOString() });
      setMonthlyCoachSessions({ count: 0, resetDate: new Date().toISOString() });
      setSubscription('free');
      setPurchasedIAPs([]);
      setBonusCredits(0);
    },
  });

  const { mutate: mutateSaveJournalEntry } = useMutation({
    mutationFn: async (entry: JournalEntry) => {
      const updated = [entry, ...journalEntries];
      await setItem('journal_entries', updated);
      return updated;
    },
    onSuccess: (data) => {
      setJournalEntries(data);
    },
  });

  const { mutate: mutateUpdateStreak } = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      if (streakData.lastCompleted === today) return streakData;

      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = streakData.lastCompleted === yesterday ? streakData.streak + 1 : 1;

      const updated: StreakData = {
        streak: newStreak,
        lastCompleted: today,
        completedDays: [...streakData.completedDays.slice(-6), today],
      };
      await setItem('streak_data', updated);
      return updated;
    },
    onSuccess: (data) => {
      if (data) setStreakData(data);
    },
  });

  const isPremium = useMemo(() => {
    return subscription === 'generator_unlimited' || subscription === 'premium_plus' || subscription === 'premium_couples' || subscription === 'lifetime';
  }, [subscription]);

  const hasCoach = useMemo(() => {
    return subscription === 'premium_plus' || subscription === 'premium_couples' || subscription === 'lifetime';
  }, [subscription]);

  const hasCouples = useMemo(() => {
    return subscription === 'premium_couples' || subscription === 'lifetime';
  }, [subscription]);

  const hasReport = useMemo(() => (reportId: string): boolean => {
    if (subscription === 'premium_plus' || subscription === 'premium_couples' || subscription === 'lifetime') return true;
    if (purchasedIAPs.includes(reportId as IAPProduct)) return true;
    if (purchasedIAPs.includes('bundle_complete')) return true;
    if (purchasedIAPs.includes('bundle_growth') && ['report_zodiac', 'report_numerology', 'prompt_deck', 'report_soulmate'].includes(reportId)) return true;
    if (purchasedIAPs.includes('bundle_starter') && ['prompt_deck', 'report_soulmate'].includes(reportId)) return true;
    return false;
  }, [subscription, purchasedIAPs]);

  const generationsRemaining = useMemo(() => {
    if (isPremium) return Infinity;
    return Math.max(0, 3 + bonusCredits - monthlyGenerations.count);
  }, [monthlyGenerations.count, isPremium, bonusCredits]);

  const coachSessionsRemaining = useMemo(() => {
    if (hasCoach) return Infinity;
    return Math.max(0, 3 - monthlyCoachSessions.count);
  }, [monthlyCoachSessions.count, hasCoach]);

  const completeOnboarding = useCallback(() => {
    mutateCompleteOnboarding();
  }, [mutateCompleteOnboarding]);

  const updateProfile = useCallback((p: Profile) => {
    mutateUpdateProfile(p);
  }, [mutateUpdateProfile]);

  const saveCreation = useCallback((c: SavedCreation) => {
    mutateSaveCreation(c);
  }, [mutateSaveCreation]);

  const deleteCreation = useCallback((id: string) => {
    mutateDeleteCreation(id);
  }, [mutateDeleteCreation]);

  const incrementGenerations = useCallback(() => {
    mutateIncrementGenerations();
  }, [mutateIncrementGenerations]);

  const incrementCoachSessions = useCallback(() => {
    mutateIncrementCoachSessions();
  }, [mutateIncrementCoachSessions]);

  const saveJournalEntry = useCallback((entry: JournalEntry) => {
    mutateSaveJournalEntry(entry);
    mutateUpdateStreak();
  }, [mutateSaveJournalEntry, mutateUpdateStreak]);

  const savePrompt = useCallback((prompt: SavedPrompt) => {
    mutateSavePrompt(prompt);
  }, [mutateSavePrompt]);

  const deleteSavedPrompt = useCallback((id: string) => {
    mutateDeleteSavedPrompt(id);
  }, [mutateDeleteSavedPrompt]);

  const deleteJournalEntry = useCallback((id: string) => {
    mutateDeleteJournalEntry(id);
  }, [mutateDeleteJournalEntry]);

  const incrementTests = useCallback(() => {
    mutateIncrementTests();
  }, [mutateIncrementTests]);

  const { mutate: mutatePurchaseIAP } = useMutation({
    mutationFn: async (productId: IAPProduct) => {
      const updated = [...purchasedIAPs, productId];
      await setItem('purchased_iaps', updated);
      if (productId === 'credit_pack_5') {
        const newBonus = bonusCredits + 5;
        await setItem('bonus_credits', newBonus);
        return { iaps: updated, bonus: newBonus };
      }
      return { iaps: updated, bonus: bonusCredits };
    },
    onSuccess: (data) => {
      setPurchasedIAPs(data.iaps);
      setBonusCredits(data.bonus);
    },
  });

  const upgradePlan = useCallback((plan: SubscriptionPlan) => {
    mutateSetSubscription(plan);
  }, [mutateSetSubscription]);

  const purchaseIAP = useCallback((productId: IAPProduct) => {
    mutatePurchaseIAP(productId);
  }, [mutatePurchaseIAP]);

  const openPaywall = useCallback((context?: string) => {
    if (context) setPaywallContext(context);
    else setPaywallContext('general');
    setShowPaywall(true);
  }, []);

  const closePaywall = useCallback(() => {
    setShowPaywall(false);
    setPaywallContext('general');
  }, []);

  const resetApp = useCallback(() => {
    mutateResetApp();
  }, [mutateResetApp]);

  return {
    onboardingComplete,
    isLoading: initQuery.isLoading,
    profile,
    savedCreations,
    journalEntries,
    savedPrompts,
    completedTests,
    streakData,
    generationsRemaining,
    coachSessionsRemaining,
    todayPromptIndex,
    subscription,
    isPremium,
    hasCoach,
    hasCouples,
    hasReport,
    purchasedIAPs,
    bonusCredits,
    showPaywall,
    paywallContext,
    completeOnboarding,
    updateProfile,
    saveCreation,
    deleteCreation,
    incrementGenerations,
    incrementCoachSessions,
    saveJournalEntry,
    savePrompt,
    deleteSavedPrompt,
    deleteJournalEntry,
    incrementTests,
    upgradePlan,
    purchaseIAP,
    openPaywall,
    closePaywall,
    resetApp,
    PLAN_DETAILS,
    IAP_PRODUCTS,
  };
});
