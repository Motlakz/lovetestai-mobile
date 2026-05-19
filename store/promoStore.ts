import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Linking, Platform } from 'react-native';
import { trackEvent } from '@/services/analytics';

export type PromoTrigger = 'completion' | 'share';

export interface AppPromo {
  id: 'speakdiary' | 'bellyclock' | 'heartloop';
  enabled: boolean;
  appName: string;
  eyebrow: string;
  inlineEyebrow?: string;
  title: string;
  body: string;
  cta: string;
  iconName: string;
  accent: string;
  deepLink: string;
  storeUrl: string;
}

interface ActivePromo {
  promoId: AppPromo['id'];
  trigger: PromoTrigger;
  placement: string;
  count: number;
  shownAt: string;
}

interface PromoState {
  activePromo: ActivePromo | null;
  recordCompletion: (placement: string) => Promise<void>;
  recordShare: (placement: string) => Promise<void>;
  dismissPromo: () => void;
  openActivePromo: () => Promise<void>;
  openPromo: (promoId: AppPromo['id'], placement: string) => Promise<void>;
}

const COMPLETION_COUNT_KEY = 'promo.completion_count';
const SHARE_COUNT_KEY = 'promo.share_count';
const COMPLETION_INTERVAL = 3;
const SHARE_INTERVAL = 2;

export const APP_PROMOS: AppPromo[] = [
  {
    id: 'speakdiary',
    enabled: true,
    appName: 'SpeakDiary',
    eyebrow: 'Also from us',
    inlineEyebrow: 'Featured',
    title: 'Try SpeakDiary',
    body: 'Capture private voice notes, reflections, and daily thoughts in a calmer diary flow.',
    cta: 'Open SpeakDiary',
    iconName: 'mic-outline',
    accent: '#38bdf8',
    deepLink: process.env.EXPO_PUBLIC_SPEAKDIARY_DEEP_LINK || 'https://speakdiary.com/',
    storeUrl: process.env.EXPO_PUBLIC_SPEAKDIARY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.speakdiary',
  },
  {
    id: 'bellyclock',
    enabled: false,
    appName: 'BellyClock',
    eyebrow: 'Coming soon',
    title: 'BellyClock',
    body: 'Pregnancy and baby timing tools will live here when the app is ready.',
    cta: 'Open BellyClock',
    iconName: 'timer-outline',
    accent: '#f97316',
    deepLink: process.env.EXPO_PUBLIC_BELLYCLOCK_DEEP_LINK || 'https://bellyclock.com',
    storeUrl: process.env.EXPO_PUBLIC_BELLYCLOCK_STORE_URL || 'https://play.google.com/store/apps/details?id=com.bellyclock',
  },
  {
    id: 'heartloop',
    enabled: false,
    appName: 'Heartloop',
    eyebrow: 'Coming soon',
    title: 'Heartloop',
    body: 'Couple connection tools can be promoted here once the app is live.',
    cta: 'Open Heartloop',
    iconName: 'heart-outline',
    accent: '#fb7185',
    deepLink: process.env.EXPO_PUBLIC_HEARTLOOP_DEEP_LINK || 'https://heartloopai.com',
    storeUrl: process.env.EXPO_PUBLIC_HEARTLOOP_STORE_URL || 'https://play.google.com/store/apps/details?id=com.heartloop',
  },
];

export function getPromoById(id: AppPromo['id']): AppPromo | undefined {
  return APP_PROMOS.find((promo) => promo.id === id);
}

function getNextEnabledPromo(): AppPromo | null {
  return APP_PROMOS.find((promo) => promo.enabled) ?? null;
}

async function incrementStoredCount(key: string): Promise<number> {
  const raw = await AsyncStorage.getItem(key);
  const current = Number.parseInt(raw || '0', 10);
  const next = Number.isFinite(current) ? current + 1 : 1;
  await AsyncStorage.setItem(key, String(next));
  return next;
}

export const usePromoStore = create<PromoState>((set, get) => ({
  activePromo: null,

  recordCompletion: async (placement) => {
    const count = await incrementStoredCount(COMPLETION_COUNT_KEY);
    if (count % COMPLETION_INTERVAL !== 0) return;
    const promo = getNextEnabledPromo();
    if (!promo) return;
    const activePromo = { promoId: promo.id, trigger: 'completion' as const, placement, count, shownAt: new Date().toISOString() };
    set({ activePromo });
    trackEvent('app_promo_shown', { promo_id: promo.id, trigger: 'completion', placement, count });
  },

  recordShare: async (placement) => {
    const count = await incrementStoredCount(SHARE_COUNT_KEY);
    if (count % SHARE_INTERVAL !== 0) return;
    const promo = getNextEnabledPromo();
    if (!promo) return;
    const activePromo = { promoId: promo.id, trigger: 'share' as const, placement, count, shownAt: new Date().toISOString() };
    set({ activePromo });
    trackEvent('app_promo_shown', { promo_id: promo.id, trigger: 'share', placement, count });
  },

  dismissPromo: () => {
    const active = get().activePromo;
    if (active) {
      trackEvent('app_promo_dismissed', { promo_id: active.promoId, trigger: active.trigger, placement: active.placement });
    }
    set({ activePromo: null });
  },

  openActivePromo: async () => {
    const active = get().activePromo;
    if (!active) return;
    const promo = getPromoById(active.promoId);
    if (!promo) return;

    trackEvent('app_promo_clicked', { promo_id: promo.id, trigger: active.trigger, placement: active.placement });
    try {
      if (Platform.OS !== 'web' && promo.deepLink && await Linking.canOpenURL(promo.deepLink)) {
        await Linking.openURL(promo.deepLink);
      } else if (promo.storeUrl) {
        await Linking.openURL(promo.storeUrl);
      } else {
        trackEvent('app_promo_open_unavailable', { promo_id: promo.id, reason: 'missing_store_url' });
      }
    } catch {
      trackEvent('app_promo_open_failed', { promo_id: promo.id });
    } finally {
      set({ activePromo: null });
    }
  },

  openPromo: async (promoId, placement) => {
    const promo = getPromoById(promoId);
    if (!promo) return;

    trackEvent('app_promo_clicked', { promo_id: promo.id, trigger: 'inline', placement });
    try {
      if (Platform.OS !== 'web' && promo.deepLink && await Linking.canOpenURL(promo.deepLink)) {
        await Linking.openURL(promo.deepLink);
      } else if (promo.storeUrl) {
        await Linking.openURL(promo.storeUrl);
      } else {
        trackEvent('app_promo_open_unavailable', { promo_id: promo.id, reason: 'missing_store_url' });
      }
    } catch {
      trackEvent('app_promo_open_failed', { promo_id: promo.id });
    }
  },
}));
