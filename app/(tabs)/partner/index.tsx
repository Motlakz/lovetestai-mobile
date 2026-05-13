import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import GhostButton from '@/components/ui/GhostButton';
import { useTheme } from '@/context/ThemeContext';
import { fontSizes, spacing } from '@/constants/theme';

export default function PartnerLiteScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
        <GlassCard style={styles.card}>
          <Ionicons name="happy-outline" size={44} color={colors.accent_rose} />
          <Text style={[styles.title, { color: colors.text_primary }]}>Two-Player Prompts</Text>
          <Text style={[styles.body, { color: colors.text_secondary }]}>
            A lighter shared prompt mode is coming later. Mutual responses will require both people to have the app and sign in for invite handling.
          </Text>
          <GradientButton
            label="Notify Me Later"
            onPress={() => Alert.alert('Saved for later', 'We will wire this into auth and invites when the feature is ready.')}
          />
          <GhostButton
            label="Keep Exploring Love Test AI"
            onPress={() => Alert.alert('Love Test AI', 'Create, test, save, and share freely for now.')}
          />
        </GlassCard>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  card: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
});
