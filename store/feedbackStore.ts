import { create } from 'zustand';
import {
  markFeedbackSubmitted,
  recordFeedbackEligibleUse,
} from '@/services/feedback';
import { trackFeedback } from '@/services/analytics';

interface FeedbackState {
  visible: boolean;
  source: string;
  openManual: (source?: string) => void;
  close: () => void;
  recordUse: (source: string) => Promise<void>;
  submitRating: (rating: number) => Promise<void>;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  visible: false,
  source: 'app',

  openManual: (source = 'manual') => set({ visible: true, source }),

  close: () => {
    trackFeedback('dismissed', { source: get().source });
    set({ visible: false });
  },

  recordUse: async (source) => {
    const shouldPrompt = await recordFeedbackEligibleUse(source);
    if (shouldPrompt && !get().visible) {
      set({ visible: true, source });
    }
  },

  submitRating: async (rating) => {
    await markFeedbackSubmitted(rating);
  },
}));
