import { showInterstitialAd } from '@/services/adMob';
import { trackEvent } from '@/services/analytics';
import { usePromoStore } from '@/store/promoStore';

const COMPLETION_ROTATION_HOURS = 6;
const COMPLETION_PROMO_DELAY_MS = 1600;

function shouldShowFirstPartyCompletion(): boolean {
  const intervalMs = COMPLETION_ROTATION_HOURS * 60 * 60 * 1000;
  return Math.floor(Date.now() / intervalMs) % 2 === 0;
}

export function showCompletionPlacement(placement: string, delayMs = COMPLETION_PROMO_DELAY_MS): void {
  setTimeout(() => {
    if (shouldShowFirstPartyCompletion()) {
      trackEvent('completion_placement_selected', { placement, surface: 'app_promo' });
      void usePromoStore.getState().recordCompletion(placement);
      return;
    }

    trackEvent('completion_placement_selected', { placement, surface: 'interstitial_ad' });
    void showInterstitialAd(placement);
  }, delayMs);
}
