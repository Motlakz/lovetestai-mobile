import { create } from 'zustand';
import {
  AppSnapshot,
  EMPTY_PROFILE,
  EMPTY_STREAK,
  JournalEntry,
  Profile,
  SavedCreation,
  SavedPrompt,
  StreakData,
  clearAll,
  insertCreation,
  insertJournalEntry,
  insertPrompt,
  loadSnapshot,
  persistCompletedTests,
  persistOnboardingComplete,
  persistProfile,
  persistStreak,
  removeCreation,
  removeCreations,
  removeJournalEntry,
  removePrompt,
} from '@/services/db';
import { useFeedbackStore } from '@/store/feedbackStore';
import { trackCrud, trackEvent } from '@/services/analytics';

interface AppState {
  isLoading: boolean;
  onboardingComplete: boolean;
  profile: Profile;
  savedCreations: SavedCreation[];
  journalEntries: JournalEntry[];
  savedPrompts: SavedPrompt[];
  completedTests: number;
  streakData: StreakData;
  todayPromptIndex: number;
  init: () => Promise<void>;
  completeOnboarding: () => void;
  updateProfile: (p: Profile) => void;
  saveCreation: (c: SavedCreation) => void;
  deleteCreation: (id: string) => void;
  deleteCreations: (ids: string[]) => void;
  saveJournalEntry: (e: JournalEntry) => void;
  updateJournalEntry: (id: string, patch: Partial<Pick<JournalEntry, 'entry'>>) => void;
  savePrompt: (p: SavedPrompt) => void;
  deleteSavedPrompt: (id: string) => void;
  deleteJournalEntry: (id: string) => void;
  incrementTests: () => void;
  resetApp: () => void;
}

function computeTodayPromptIndex(): number {
  return Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  ) % 30;
}

function nextStreak(prev: StreakData): StreakData {
  const today = new Date().toISOString().split('T')[0];
  if (prev.lastCompleted === today) return prev;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = prev.lastCompleted === yesterday ? prev.streak + 1 : 1;
  return {
    streak: newStreak,
    lastCompleted: today,
    completedDays: [...prev.completedDays.slice(-6), today],
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  isLoading: true,
  onboardingComplete: false,
  profile: EMPTY_PROFILE,
  savedCreations: [],
  journalEntries: [],
  savedPrompts: [],
  completedTests: 0,
  streakData: EMPTY_STREAK,
  todayPromptIndex: computeTodayPromptIndex(),

  init: async () => {
    try {
      const snap: AppSnapshot = await loadSnapshot();
      trackCrud('app_snapshot', 'read', {
        saved_creations: snap.savedCreations.length,
        journal_entries: snap.journalEntries.length,
        saved_prompts: snap.savedPrompts.length,
        onboarding_complete: snap.onboardingComplete,
      });
      set({
        isLoading: false,
        onboardingComplete: snap.onboardingComplete,
        profile: snap.profile,
        savedCreations: snap.savedCreations,
        journalEntries: snap.journalEntries,
        savedPrompts: snap.savedPrompts,
        streakData: snap.streak,
        completedTests: snap.completedTests,
        todayPromptIndex: computeTodayPromptIndex(),
      });
    } catch (e) {
      console.log('App init failed:', e);
      set({ isLoading: false });
    }
  },

  completeOnboarding: () => {
    set({ onboardingComplete: true });
    void persistOnboardingComplete(true);
    trackEvent('onboarding_completed');
  },

  updateProfile: (p) => {
    set({ profile: p });
    void persistProfile(p);
    trackCrud('profile', 'update', {
      has_name: !!p.name,
      has_date_of_birth: !!p.dateOfBirth,
      has_intent: !!p.intent,
      relationship_status_set: !!p.relationshipStatus,
    });
  },

  saveCreation: (c) => {
    set((s) => ({ savedCreations: [c, ...s.savedCreations] }));
    void insertCreation(c);
    trackCrud('creation', 'create', { creation_type: c.type });
    void useFeedbackStore.getState().recordUse(`creation:${c.type}`);
  },

  deleteCreation: (id) => {
    set((s) => ({ savedCreations: s.savedCreations.filter((x) => x.id !== id) }));
    void removeCreation(id);
    trackCrud('creation', 'delete');
  },

  deleteCreations: (ids) => {
    const removeSet = new Set(ids);
    set((s) => ({ savedCreations: s.savedCreations.filter((x) => !removeSet.has(x.id)) }));
    void removeCreations(ids);
    trackCrud('creation', 'bulk_delete', { count: removeSet.size });
  },

  saveJournalEntry: (e) => {
    const newStreak = nextStreak(get().streakData);
    set((s) => ({
      journalEntries: [e, ...s.journalEntries],
      streakData: newStreak,
    }));
    void insertJournalEntry(e);
    void persistStreak(newStreak);
    trackCrud('journal_entry', 'create');
    trackEvent('daily_prompt_completed', { streak: newStreak.streak });
    void useFeedbackStore.getState().recordUse('journal');
  },

  updateJournalEntry: (id, patch) => {
    const current = get().journalEntries.find((j) => j.id === id);
    if (!current) return;
    const updated = { ...current, ...patch };
    set((s) => ({
      journalEntries: s.journalEntries.map((j) => (j.id === id ? updated : j)),
    }));
    void insertJournalEntry(updated);
    trackCrud('journal_entry', 'update');
  },

  savePrompt: (p) => {
    set((s) => ({ savedPrompts: [p, ...s.savedPrompts] }));
    void insertPrompt(p);
    trackCrud('saved_prompt', 'create');
    void useFeedbackStore.getState().recordUse('prompt');
  },

  deleteSavedPrompt: (id) => {
    set((s) => ({ savedPrompts: s.savedPrompts.filter((x) => x.id !== id) }));
    void removePrompt(id);
    trackCrud('saved_prompt', 'delete');
  },

  deleteJournalEntry: (id) => {
    set((s) => ({ journalEntries: s.journalEntries.filter((x) => x.id !== id) }));
    void removeJournalEntry(id);
    trackCrud('journal_entry', 'delete');
  },

  incrementTests: () => {
    const next = get().completedTests + 1;
    set({ completedTests: next });
    void persistCompletedTests(next);
    trackEvent('test_completed', { completed_tests: next });
    void useFeedbackStore.getState().recordUse('test');
  },

  resetApp: () => {
    set({
      onboardingComplete: false,
      profile: EMPTY_PROFILE,
      savedCreations: [],
      journalEntries: [],
      savedPrompts: [],
      completedTests: 0,
      streakData: EMPTY_STREAK,
    });
    void clearAll();
    trackCrud('app_data', 'clear');
  },
}));

export type {
  Profile,
  SavedCreation,
  JournalEntry,
  SavedPrompt,
  StreakData,
} from '@/services/db';
