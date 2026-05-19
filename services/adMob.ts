import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { trackEvent } from '@/services/analytics';

const PRODUCTION_INTERSTITIAL_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID || 'ca-app-pub-1422001850914649/9495357429';
const canUseAdMob = Platform.OS !== 'web' && Constants.appOwnership !== 'expo';

export async function showInterstitialAd(placement: string): Promise<boolean> {
  if (!canUseAdMob) return false;

  trackEvent('ad_interstitial_requested', { placement, ad_network: 'admob' });

  let mobileAds: any;
  try {
    mobileAds = require('react-native-google-mobile-ads');
  } catch {
    trackEvent('ad_interstitial_unavailable', { placement, ad_network: 'admob', reason: 'native_module_missing' });
    return false;
  }

  const unitId = __DEV__ ? mobileAds.TestIds.INTERSTITIAL : PRODUCTION_INTERSTITIAL_UNIT_ID;

  const interstitial = mobileAds.InterstitialAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  return new Promise((resolve) => {
    let resolved = false;
    const unsubscribers: Array<() => void> = [];
    const timeout = setTimeout(() => finish(false, 'timeout'), 5000);

    const finish = (shown: boolean, reason: string) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      trackEvent(shown ? 'ad_interstitial_closed' : 'ad_interstitial_not_shown', {
        placement,
        ad_network: 'admob',
        reason,
      });
      resolve(shown);
    };

    unsubscribers.push(
      interstitial.addAdEventListener(mobileAds.AdEventType.LOADED, () => {
        trackEvent('ad_interstitial_loaded', { placement, ad_network: 'admob' });
        interstitial.show();
      })
    );

    unsubscribers.push(
      interstitial.addAdEventListener(mobileAds.AdEventType.ERROR, (error: any) => {
        trackEvent('ad_interstitial_failed', {
          placement,
          ad_network: 'admob',
          error_code: error && 'code' in error ? String(error.code) : 'unknown',
        });
        finish(false, 'load_error');
      })
    );

    unsubscribers.push(
      interstitial.addAdEventListener(mobileAds.AdEventType.CLOSED, () => {
        finish(true, 'closed');
      })
    );

    interstitial.load();
  });
}
