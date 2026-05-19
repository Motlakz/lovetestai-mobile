import React, { useEffect, useState } from 'react';
import { Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Constants from 'expo-constants';
import { fontSizes, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { trackEvent } from '@/services/analytics';

const PRODUCTION_NATIVE_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_NATIVE_UNIT_ID || 'ca-app-pub-1422001850914649/6137046437';
const canUseAdMob = Platform.OS !== 'web' && Constants.appOwnership !== 'expo';

interface AdMobNativeAdProps {
  placement: string;
  style?: StyleProp<ViewStyle>;
}

export default function AdMobNativeAd({ placement, style }: AdMobNativeAdProps) {
  const { colors } = useTheme();
  const [nativeAd, setNativeAd] = useState<any | null>(null);
  const [adMob, setAdMob] = useState<any | null>(null);

  useEffect(() => {
    if (!canUseAdMob) return undefined;

    let active = true;
    let loadedAd: any | null = null;
    let mobileAds: any;

    try {
      mobileAds = require('react-native-google-mobile-ads');
    } catch {
      trackEvent('ad_native_unavailable', { placement, ad_network: 'admob', reason: 'native_module_missing' });
      return undefined;
    }

    const unitId = __DEV__ ? mobileAds.TestIds.NATIVE : PRODUCTION_NATIVE_UNIT_ID;
    setAdMob(mobileAds);

    mobileAds.NativeAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: true })
      .then((ad: any) => {
        if (!active) {
          ad.destroy();
          return;
        }
        loadedAd = ad;
        setNativeAd(ad);
        trackEvent('ad_native_loaded', { placement, ad_network: 'admob' });
      })
      .catch((error: { code?: string }) => {
        trackEvent('ad_native_failed', {
          placement,
          ad_network: 'admob',
          error_code: error?.code ?? 'unknown',
        });
      });

    return () => {
      active = false;
      loadedAd?.destroy();
    };
  }, [placement]);

  if (!canUseAdMob || !nativeAd || !adMob) return null;

  const { NativeAdView, NativeAsset, NativeAssetType, NativeMediaView } = adMob;

  return (
    <View style={[styles.container, style]}>
      <NativeAdView nativeAd={nativeAd} style={[styles.card, { backgroundColor: colors.glass_fill, borderColor: colors.glass_border }]}>
        <NativeMediaView style={styles.media} />
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text style={[styles.headline, { color: colors.text_primary }]} numberOfLines={2}>
                {nativeAd.headline}
              </Text>
            </NativeAsset>
            <Text style={[styles.adBadge, { color: colors.text_gold, borderColor: colors.accent_gold }]}>Ad</Text>
          </View>

          {nativeAd.advertiser ? (
            <NativeAsset assetType={NativeAssetType.ADVERTISER}>
              <Text style={[styles.advertiser, { color: colors.text_muted }]} numberOfLines={1}>
                {nativeAd.advertiser}
              </Text>
            </NativeAsset>
          ) : null}

          {nativeAd.body ? (
            <NativeAsset assetType={NativeAssetType.BODY}>
              <Text style={[styles.body, { color: colors.text_secondary }]} numberOfLines={3}>
                {nativeAd.body}
              </Text>
            </NativeAsset>
          ) : null}

          {nativeAd.callToAction ? (
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
              <View style={[styles.cta, { backgroundColor: colors.accent_rose }]}>
                <Text style={styles.ctaText} numberOfLines={1}>
                  {nativeAd.callToAction}
                </Text>
              </View>
            </NativeAsset>
          ) : null}
        </View>
      </NativeAdView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  media: {
    aspectRatio: 1.9,
    width: '100%',
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  headline: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: '700',
    lineHeight: 21,
  },
  adBadge: {
    borderRadius: radius.sm,
    borderWidth: 1,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    textTransform: 'uppercase',
  },
  advertiser: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  body: {
    fontSize: fontSizes.sm,
    lineHeight: 19,
  },
  cta: {
    alignItems: 'center',
    borderRadius: radius.full,
    marginTop: spacing.xs,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  ctaText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '800',
  },
});
