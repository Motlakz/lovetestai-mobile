import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { fontSizes, spacing, radius } from '@/constants/theme';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';
import GhostButton from './GhostButton';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

const RATING_CONFIG: { value: number; icon: string; label: string; color: string }[] = [
  { value: 1, icon: 'sad-outline', label: 'Poor', color: '#FF6B8A' },
  { value: 2, icon: 'thumbs-down-outline', label: 'Below Average', color: '#FF9E6B' },
  { value: 3, icon: 'hand-right-outline', label: 'Average', color: '#FFD166' },
  { value: 4, icon: 'happy-outline', label: 'Good', color: '#7ED8C0' },
  { value: 5, icon: 'heart-outline', label: 'Excellent', color: '#FF3D7F' },
];

export default function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const { colors } = useTheme();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const scaleAnims = useRef(RATING_CONFIG.map(() => new Animated.Value(1))).current;
  const selectedScaleAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRating(0);
      setComment('');
      setSubmitted(false);
      fadeAnim.setValue(0);
      successAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible, fadeAnim, successAnim]);

  const handleSelectRating = useCallback((value: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(value);

    scaleAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.timing(anim, { toValue: i === value - 1 ? 1.3 : 0.85, duration: 150, useNativeDriver: true }),
        Animated.spring(anim, { toValue: i === value - 1 ? 1.15 : 1, useNativeDriver: true, damping: 10 }),
      ]).start();
    });

    selectedScaleAnim.setValue(0);
    Animated.spring(selectedScaleAnim, { toValue: 1, useNativeDriver: true, damping: 8 }).start();
  }, [scaleAnims, selectedScaleAnim]);

  const handleSubmit = useCallback(() => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
    Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, damping: 8 }).start();

    setTimeout(() => {
      onClose();
    }, 2000);
  }, [rating, onClose, successAnim]);

  const selectedConfig = rating > 0 ? RATING_CONFIG[rating - 1] : null;
  const successScale = successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { backgroundColor: colors.overlay_dark, opacity: fadeAnim }]}>
        <View style={styles.centered}>
          {!submitted ? (
            <GlassCard style={[styles.card, { backgroundColor: colors.bg_surface, borderColor: colors.glass_border }]}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.text_muted} />
              </TouchableOpacity>

              <Text style={[styles.title, { color: colors.text_primary }]}>How was your experience?</Text>
              <Text style={[styles.subtitle, { color: colors.text_secondary }]}>Your feedback helps us improve Love Test AI</Text>

              <View style={styles.ratingRow}>
                {RATING_CONFIG.map((item, index) => (
                  <Animated.View key={item.value} style={{ transform: [{ scale: scaleAnims[index] }] }}>
                    <TouchableOpacity
                      onPress={() => handleSelectRating(item.value)}
                      style={[
                        styles.ratingItem,
                        { borderColor: rating === item.value ? item.color : colors.glass_border, backgroundColor: rating === item.value ? `${item.color}18` : colors.glass_fill },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={item.icon as any} size={26} color={rating === item.value ? item.color : colors.text_muted} />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>

              {selectedConfig && (
                <Animated.View style={[styles.selectedLabel, { transform: [{ scale: selectedScaleAnim }] }]}>
                  <Text style={[styles.selectedText, { color: selectedConfig.color }]}>{selectedConfig.label}</Text>
                </Animated.View>
              )}

              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Tell us more (optional)..."
                placeholderTextColor={colors.text_muted}
                multiline
                maxLength={500}
                style={[styles.input, { backgroundColor: colors.glass_fill, borderColor: colors.glass_border, color: colors.text_primary }]}
              />

              {comment.length > 0 && (
                <Text style={[styles.charCount, { color: colors.text_muted }]}>{comment.length}/500</Text>
              )}

              <GradientButton label="Submit Feedback" onPress={handleSubmit} disabled={rating === 0} />
              <GhostButton label="Maybe Later" onPress={onClose} style={styles.skipBtn} />
            </GlassCard>
          ) : (
            <GlassCard style={[styles.card, styles.successCard, { backgroundColor: colors.bg_surface, borderColor: colors.glass_border }]}>
              <Animated.View style={{ transform: [{ scale: successScale }], alignItems: 'center' as const, gap: spacing.md }}>
                <LinearGradient colors={[colors.success, '#2E9E96']} style={styles.successCircle}>
                  <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.successTitle, { color: colors.text_primary }]}>Thank You!</Text>
                <Text style={[styles.successDesc, { color: colors.text_secondary }]}>
                  Your feedback means the world to us.{'\n'}We are always working to make Love Test AI better.
                </Text>
              </Animated.View>
            </GlassCard>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  closeBtn: {
    position: 'absolute' as const,
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.xs,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    textAlign: 'center' as const,
    marginTop: -spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: spacing.md,
  },
  ratingItem: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  selectedLabel: {
    alignItems: 'center' as const,
  },
  selectedText: {
    fontSize: fontSizes.md,
    fontWeight: '600' as const,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: fontSizes.base,
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  charCount: {
    fontSize: fontSizes.xs,
    textAlign: 'right' as const,
    marginTop: -spacing.sm,
  },
  skipBtn: {
    borderWidth: 0,
    paddingVertical: spacing.xs,
  },
  successCard: {
    alignItems: 'center' as const,
    padding: spacing['2xl'],
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  successTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: '700' as const,
  },
  successDesc: {
    fontSize: fontSizes.base,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
});
