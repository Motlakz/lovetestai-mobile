import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import { firestore } from '@/services/firebase';

const FEEDBACK_STATE_KEY = 'feedback_prompt_state_v1';
const FEEDBACK_SESSION_KEY = 'feedback_session_id';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface FeedbackPromptState {
  useCount: number;
  lastPromptedAt: string | null;
  lastSubmittedAt: string | null;
  lastRating: number | null;
  positiveSubmitted: boolean;
  lastPromptSource: string | null;
}

export interface InternalFeedbackData {
  source: string;
  starRating: number;
  comments: string;
  accountId?: string | null;
  email?: string | null;
}

const DEFAULT_STATE: FeedbackPromptState = {
  useCount: 0,
  lastPromptedAt: null,
  lastSubmittedAt: null,
  lastRating: null,
  positiveSubmitted: false,
  lastPromptSource: null,
};

async function loadFeedbackState(): Promise<FeedbackPromptState> {
  try {
    const raw = await AsyncStorage.getItem(FEEDBACK_STATE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

async function persistFeedbackState(state: FeedbackPromptState): Promise<void> {
  await AsyncStorage.setItem(FEEDBACK_STATE_KEY, JSON.stringify(state));
}

export async function getFeedbackSessionId(): Promise<string> {
  const existing = await AsyncStorage.getItem(FEEDBACK_SESSION_KEY);
  if (existing) return existing;

  const id = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(FEEDBACK_SESSION_KEY, id);
  return id;
}

export async function recordFeedbackEligibleUse(source: string): Promise<boolean> {
  const state = await loadFeedbackState();
  const nextUseCount = state.useCount + 1;
  const nextState: FeedbackPromptState = { ...state, useCount: nextUseCount };

  if (state.positiveSubmitted || nextUseCount % 3 !== 0) {
    await persistFeedbackState(nextState);
    return false;
  }

  const now = Date.now();
  const lastPromptedAt = state.lastPromptedAt ? new Date(state.lastPromptedAt).getTime() : 0;
  const hasLowRating = state.lastRating === 1 || state.lastRating === 2;

  if (hasLowRating && lastPromptedAt && now - lastPromptedAt < WEEK_MS) {
    await persistFeedbackState(nextState);
    return false;
  }

  await persistFeedbackState({
    ...nextState,
    lastPromptedAt: new Date(now).toISOString(),
    lastPromptSource: source,
  });
  return true;
}

export async function markFeedbackSubmitted(starRating: number): Promise<void> {
  const state = await loadFeedbackState();
  await persistFeedbackState({
    ...state,
    lastSubmittedAt: new Date().toISOString(),
    lastRating: starRating,
    positiveSubmitted: starRating >= 3,
  });
}

export async function submitInternalFeedback(data: InternalFeedbackData): Promise<string> {
  const sessionId = await getFeedbackSessionId();
  const payload = {
    calculatorType: data.source,
    source: data.source,
    score: null,
    accuracyRating: null,
    starRating: data.starRating,
    wouldRecommend: data.starRating >= 4,
    comments: data.comments.trim(),
    email: data.email ?? '',
    sessionId,
    accountId: data.accountId ?? null,
    platform: Platform.OS,
    appSurface: 'mobile',
    createdAt: serverTimestamp(),
  };

  if (!firestore) {
    console.log('Firebase not configured. Feedback would be submitted:', payload);
    return 'mock-feedback-id';
  }

  const docRef = await addDoc(collection(firestore, 'feedback'), payload);
  return docRef.id;
}
