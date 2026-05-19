import React, { useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import AdMobNativeAd from '@/components/ads/AdMobNativeAd';
import InAppPromoCard from '@/components/promos/InAppPromoCard';
import { AppPromo } from '@/store/promoStore';

interface InAppPromoAdSlotProps {
  placement: string;
  promoId?: AppPromo['id'];
  intervalHours?: number;
  style?: StyleProp<ViewStyle>;
}

export default function InAppPromoAdSlot({
  placement,
  promoId = 'speakdiary',
  intervalHours = 6,
  style,
}: InAppPromoAdSlotProps) {
  const showPromo = useMemo(() => {
    const intervalMs = Math.max(intervalHours, 1) * 60 * 60 * 1000;
    return Math.floor(Date.now() / intervalMs) % 2 === 0;
  }, [intervalHours]);

  if (showPromo) {
    return <InAppPromoCard promoId={promoId} placement={placement} style={style} />;
  }

  return <AdMobNativeAd placement={placement} style={style} />;
}
