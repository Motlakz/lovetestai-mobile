import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { useFonts } from "expo-font";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp } from "@/context/AppContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import AnimatedSplash from "@/components/ui/AnimatedSplash";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { claimDailyPromptSlot } from "@/services/notifications";
import { AppAlertProvider } from "@/components/ui/AppAlertModal";
import { AuthGateProvider } from "@/components/auth/AuthGateModal";
import FeedbackProvider from "@/components/ui/FeedbackProvider";
import InAppPromoModal from "@/components/promos/InAppPromoModal";
import { useAuthStore } from "@/store/authStore";
import { usePartnerStore } from "@/store/partnerStore";
import { useInboxStore } from "@/store/inboxStore";
import { trackScreen } from "@/services/analytics";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { onboardingComplete, isLoading } = useApp();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const toast = useToast();
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    void (async () => {
      await useAuthStore.getState().init();
      await usePartnerStore.getState().init();
      await useInboxStore.getState().init();
    })();
  }, []);

  useEffect(() => {
    if (isLoading || !onboardingComplete) return;
    void (async () => {
      const fire = await claimDailyPromptSlot();
      if (fire) {
        toast.info("Today's love prompt is ready in Daily.");
        void useInboxStore.getState().push({
          kind: 'daily_prompt',
          title: "Today's love prompt is ready",
          body: 'Open the Daily tab to reflect on a fresh prompt.',
          route: '/(tabs)/daily',
        });
      }
    })();
  }, [isLoading, onboardingComplete, toast]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    void SplashScreen.hideAsync();

    const inOnboarding = segments[0] === 'onboarding';

    if (!onboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingComplete && inOnboarding) {
      router.replace('/(tabs)/(home)');
    }
  }, [onboardingComplete, isLoading, fontsLoaded, segments, router]);

  useEffect(() => {
    trackScreen(segments.join('/') || 'root');
  }, [segments]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {showSplash && <AnimatedSplash onFinish={handleSplashFinish} />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg_deep },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="create-mode"
          options={{
            headerShown: false,
            presentation: 'modal',
            gestureEnabled: true,
          }}
        />
      </Stack>
      <InAppPromoModal />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AppProvider>
            <AppAlertProvider>
              <ToastProvider>
                <AuthGateProvider>
                  <FeedbackProvider>
                    <RootLayoutNav />
                  </FeedbackProvider>
                </AuthGateProvider>
              </ToastProvider>
            </AppAlertProvider>
          </AppProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
