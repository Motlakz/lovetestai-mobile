import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { fontSizes, radius, spacing } from '@/constants/theme';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';
import GhostButton from './GhostButton';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

export interface AlertConfig {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  buttons?: AlertButton[];
  dismissible?: boolean;
}

interface AppAlertContextValue {
  alert: (config: AlertConfig) => void;
  confirm: (title: string, message?: string) => Promise<boolean>;
  dismiss: () => void;
}

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const dismiss = useCallback(() => setConfig(null), []);

  const alert = useCallback((c: AlertConfig) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfig({ dismissible: true, ...c });
  }, []);

  const confirm = useCallback((title: string, message?: string) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        title,
        message,
        dismissible: true,
        buttons: [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Confirm', style: 'default', onPress: () => resolve(true) },
        ],
      });
    });
  }, []);

  const api = useMemo<AppAlertContextValue>(() => ({ alert, confirm, dismiss }), [alert, confirm, dismiss]);

  return (
    <AppAlertContext.Provider value={api}>
      {children}
      <AppAlertViewport config={config} onDismiss={dismiss} />
    </AppAlertContext.Provider>
  );
}

export function useAppAlert(): AppAlertContextValue {
  const ctx = useContext(AppAlertContext);
  if (!ctx) throw new Error('useAppAlert must be used within AppAlertProvider');
  return ctx;
}

function AppAlertViewport({ config, onDismiss }: { config: AlertConfig | null; onDismiss: () => void }) {
  const { colors } = useTheme();

  const handleButton = useCallback((btn: AlertButton) => {
    btn.onPress?.();
    onDismiss();
  }, [onDismiss]);

  if (!config) return null;

  const buttons = config.buttons ?? [{ text: 'OK', style: 'default' }];

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => config.dismissible && onDismiss()}
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => config.dismissible && onDismiss()}
      >
        <Pressable style={styles.cardWrap} onPress={(e) => e.stopPropagation()}>
          <GlassCard style={styles.card}>
            {config.icon && (
              <View style={[styles.iconBubble, { backgroundColor: `${colors.accent_rose}20`, borderColor: colors.accent_rose }]}>
                <Ionicons name={config.icon} size={28} color={colors.accent_rose} />
              </View>
            )}
            <Text style={[styles.title, { color: colors.text_primary }]}>{config.title}</Text>
            {config.message && (
              <Text style={[styles.message, { color: colors.text_secondary }]}>{config.message}</Text>
            )}
            <View style={styles.actions}>
              {buttons.map((btn, i) => {
                if (btn.style === 'cancel') {
                  return <GhostButton key={i} label={btn.text} onPress={() => handleButton(btn)} />;
                }
                if (btn.style === 'destructive') {
                  return (
                    <Pressable
                      key={i}
                      onPress={() => handleButton(btn)}
                      style={({ pressed }) => [
                        styles.destructiveBtn,
                        { borderColor: colors.error, opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Text style={[styles.destructiveLabel, { color: colors.error }]}>{btn.text}</Text>
                    </Pressable>
                  );
                }
                return <GradientButton key={i} label={btn.text} onPress={() => handleButton(btn)} />;
              })}
            </View>
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
  cardWrap: {
    width: '100%',
    maxWidth: 380,
  },
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
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  destructiveBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructiveLabel: {
    fontSize: fontSizes.base,
    fontWeight: '500',
  },
});
