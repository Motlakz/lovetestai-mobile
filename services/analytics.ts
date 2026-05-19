import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { firestore } from '@/services/firebase';
import { getOrCreateDeviceId } from '@/services/db';

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;

const COLLECTION = 'mobile_analytics_events';
const MAX_KEY_LENGTH = 40;
const MAX_STRING_LENGTH = 80;
const SENSITIVE_PARAM_KEY = /(^|_)(content|body|message|comment|email|prompt_text|entry|to_name|from_name|display_name|account_id|uid)$/i;

function cleanKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, MAX_KEY_LENGTH);
}

function cleanValue(value: AnalyticsValue): string | number | boolean | null {
  if (value === undefined) return null;
  if (typeof value === 'string') return value.slice(0, MAX_STRING_LENGTH);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  return value;
}

function sanitizeParams(params: AnalyticsParams = {}): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([key]) => !SENSITIVE_PARAM_KEY.test(key))
      .map(([key, value]) => [cleanKey(key), cleanValue(value)]),
  );
}

export async function trackEvent(eventName: string, params?: AnalyticsParams): Promise<void> {
  if (!firestore) {
    if (__DEV__) console.log('[Analytics]', eventName, params ?? {});
    return;
  }

  try {
    const deviceId = await getOrCreateDeviceId();
    await addDoc(collection(firestore, COLLECTION), {
      name: cleanKey(eventName),
      params: sanitizeParams(params),
      deviceId,
      platform: Platform.OS,
      appVersion: Constants.expoConfig?.version ?? null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    if (__DEV__) console.log('[Analytics] event failed:', eventName, error);
  }
}

export function trackScreen(screenName: string, params?: AnalyticsParams): void {
  void trackEvent('screen_view', { screen_name: screenName, ...params });
}

export function trackOnboardingStep(step: string, action: string, params?: AnalyticsParams): void {
  void trackEvent('onboarding_step', { step, action, ...params });
}

export function trackGeneratorOpened(generatorType: string): void {
  void trackEvent('generator_opened', { generator_type: generatorType, content_type: 'generator' });
}

export function trackGeneratorStarted(generatorType: string): void {
  void trackEvent('generator_started', { generator_type: generatorType });
}

export function trackGeneratorCompleted(generatorType: string, source?: string): void {
  void trackEvent('generator_completed', { generator_type: generatorType, source: source ?? null });
}

export function trackGeneratorFailed(generatorType: string, reason: string): void {
  void trackEvent('generator_failed', { generator_type: generatorType, reason });
}

export function trackShare(contentType: string, method: string, status: 'started' | 'success' | 'failed' | 'cancelled' = 'success'): void {
  void trackEvent('share', { content_type: contentType, method, status });
  if (status === 'success') {
    void import('@/store/promoStore')
      .then(({ usePromoStore }) => usePromoStore.getState().recordShare(`share_${contentType}_${method}`))
      .catch(() => undefined);
  }
}

export function trackCrud(resource: string, operation: 'create' | 'read' | 'update' | 'delete' | 'bulk_delete' | 'clear', params?: AnalyticsParams): void {
  void trackEvent('crud_operation', { resource, operation, ...params });
}

export function trackFeedback(event: 'opened' | 'dismissed' | 'rating_selected' | 'submitted' | 'submit_failed', params?: AnalyticsParams): void {
  void trackEvent(`feedback_${event}`, params);
}

export function trackError(context: string, reason: string): void {
  void trackEvent('error', { context, reason });
}
