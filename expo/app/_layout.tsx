import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp } from "@/context/AppContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import PaywallModal from "@/components/ui/PaywallModal";
import AnimatedSplash from "@/components/ui/AnimatedSplash";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { onboardingComplete, isLoading } = useApp();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    void SplashScreen.hideAsync();

    const inOnboarding = segments[0] === 'onboarding';

    if (!onboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingComplete && inOnboarding) {
      router.replace('/(tabs)/(home)');
    }
  }, [onboardingComplete, isLoading, segments, router]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <PaywallModal />
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
        <Stack.Screen
          name="partner-dashboard"
          options={{
            headerShown: false,
            presentation: 'modal',
            gestureEnabled: true,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AppProvider>
            <RootLayoutNav />
          </AppProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
