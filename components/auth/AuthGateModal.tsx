import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/context/ThemeContext';
import { fontSizes, spacing } from '@/constants/theme';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import GhostButton from '@/components/ui/GhostButton';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { isFirebaseAvailable } from '@/services/firebase';

WebBrowser.maybeCompleteAuthSession();

interface GateRequest {
  reason: string;
  resolve: (success: boolean) => void;
}

interface AuthGateContextValue {
  requireAuth: (reason: string) => Promise<boolean>;
  openSignIn: () => Promise<boolean>;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useAuthGate must be used within AuthGateProvider');
  return ctx;
}

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<GateRequest | null>(null);
  const account = useAuthStore((s) => s.account);

  const requireAuth = useCallback((reason: string) => {
    if (account) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      setRequest({ reason, resolve });
    });
  }, [account]);

  const openSignIn = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      setRequest({ reason: 'Sign in to sync your love notes and pair with your partner.', resolve });
    });
  }, []);

  const handleClose = useCallback((success: boolean) => {
    request?.resolve(success);
    setRequest(null);
  }, [request]);

  const api = useMemo<AuthGateContextValue>(() => ({ requireAuth, openSignIn }), [requireAuth, openSignIn]);

  return (
    <AuthGateContext.Provider value={api}>
      {children}
      {request && <AuthGateSheet request={request} onClose={handleClose} />}
    </AuthGateContext.Provider>
  );
}

function AuthGateSheet({ request, onClose }: { request: GateRequest; onClose: (success: boolean) => void }) {
  const { colors } = useTheme();
  const toast = useToast();
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithGoogleIdToken = useAuthStore((s) => s.signInWithGoogleIdToken);
  const [busy, setBusy] = useState(false);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const platformClientId = Platform.select({
    android: androidClientId,
    ios: iosClientId,
    default: webClientId,
  });

  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.OS === 'web' ? webClientId : undefined,
    androidClientId,
    iosClientId,
    webClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (!idToken) {
        toast.error('Google sign-in returned no token.');
        setBusy(false);
        return;
      }
      void (async () => {
        try {
          await signInWithGoogleIdToken(idToken);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.success('Signed in with Google.');
          onClose(true);
        } catch (e) {
          console.log('Google sign-in failed:', e);
          toast.error('Sign-in failed. Try again.');
        } finally {
          setBusy(false);
        }
      })();
    } else if (response?.type === 'error') {
      setBusy(false);
      toast.error('Google sign-in cancelled or failed.');
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setBusy(false);
    }
  }, [response, signInWithGoogleIdToken, toast, onClose]);

  const handleGoogle = useCallback(async () => {
    if (!isFirebaseAvailable) {
      toast.error('Firebase is not configured.');
      return;
    }
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBusy(true);
      try {
        await signInWithGoogle();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success('Signed in with Google.');
        onClose(true);
      } catch (e: any) {
        console.log('Native Google sign-in failed:', e);
        if (e?.message === 'Sign-in cancelled') {
          return;
        }
        toast.error(e?.message || 'Sign-in failed. Try again.');
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!platformClientId) {
      toast.error('Web Google client ID is missing.');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusy(true);
    try {
      await promptAsync();
    } catch (e) {
      console.log('promptAsync failed:', e);
      toast.error('Could not open Google sign-in.');
      setBusy(false);
    }
  }, [promptAsync, toast, platformClientId, signInWithGoogle, onClose]);

  const handleCancel = useCallback(() => {
    onClose(false);
  }, [onClose]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleCancel}>
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Pressable style={styles.cardWrap} onPress={(e) => e.stopPropagation()}>
          <GlassCard style={styles.card}>
            <View style={[styles.iconBubble, { backgroundColor: `${colors.accent_rose}20`, borderColor: colors.accent_rose }]}>
              <Ionicons name="heart" size={28} color={colors.accent_rose} />
            </View>
            <Text style={[styles.title, { color: colors.text_primary }]}>Create your account</Text>
            <Text style={[styles.message, { color: colors.text_secondary }]}>{request.reason}</Text>

            {busy ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.accent_rose} />
                <Text style={[styles.loadingText, { color: colors.text_secondary }]}>Getting account ready...</Text>
              </View>
            ) : (
              <View style={styles.actionStack}>
                <GradientButton
                  label="Continue with Google"
                  onPress={handleGoogle}
                  icon={<Ionicons name="logo-google" size={18} color="#fff" />}
                />
              </View>
            )}

            <Text style={[styles.fineprint, { color: colors.text_muted }]}>
              Google lets you recover your account and keep the same identity across devices.
            </Text>
            <GhostButton label="Not now" onPress={handleCancel} />
          </GlassCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  cardWrap: { width: '100%', maxWidth: 420 },
  card: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  title: { fontSize: fontSizes.lg, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: fontSizes.sm, textAlign: 'center', lineHeight: 20 },
  fineprint: { fontSize: fontSizes.xs, textAlign: 'center', lineHeight: 16, marginTop: spacing.xs },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: { fontSize: fontSizes.sm },
  actionStack: { width: '100%', gap: spacing.sm },
});
