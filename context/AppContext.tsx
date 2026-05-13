import React, { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

export type { Profile, SavedCreation, JournalEntry, SavedPrompt, StreakData } from '@/store/appStore';

export function AppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useAppStore.getState().init();
  }, []);
  return <>{children}</>;
}

export function useApp() {
  return useAppStore();
}
