import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { fontSizes, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
}

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  route?: string;
  action?: () => void;
  section: string;
}

export default function DrawerMenu({ visible, onClose, onOpenFeedback }: DrawerMenuProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useApp();

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideAnim, overlayAnim]);

  const handleNavigate = useCallback((route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 250);
  }, [onClose, router]);

  const menuItems: MenuItem[] = [
    { id: 'home', icon: 'home-outline', label: 'Home', route: '/(tabs)/(home)', section: 'main' },
    { id: 'tests', icon: 'heart-outline', label: 'Tests', route: '/(tabs)/tests', section: 'main' },
    { id: 'daily', icon: 'calendar-outline', label: 'Daily Prompts', route: '/(tabs)/daily', section: 'main' },
    { id: 'partner', icon: 'happy-outline', label: 'Partner Prompts', route: '/(tabs)/partner', section: 'features' },
    { id: 'feedback', icon: 'star-outline', label: 'Rate Experience', action: () => { onClose(); setTimeout(onOpenFeedback, 300); }, section: 'features' },
    { id: 'profile', icon: 'person-outline', label: 'My Profile', route: '/(tabs)/profile', section: 'account' },
  ];

  const initials = (profile.name || 'LT').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const renderSection = (sectionId: string, label: string) => {
    const items = menuItems.filter(m => m.section === sectionId);
    return (
      <View key={sectionId} style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.text_muted }]}>{label}</Text>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              if (item.action) item.action();
              else if (item.route) handleNavigate(item.route);
            }}
            style={[styles.menuItem, { borderBottomColor: colors.glass_border }]}
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon as any} size={20} color={colors.text_secondary} />
            <Text style={[styles.menuLabel, { color: colors.text_primary }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text_muted} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} pointerEvents={visible ? 'auto' : 'none'}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }], backgroundColor: colors.bg_surface, width: DRAWER_WIDTH }]}>
        <View style={[styles.drawerHeader, { paddingTop: insets.top + spacing.md }]}>
          <LinearGradient colors={[colors.accent_rose, colors.accent_violet]} style={styles.avatarCircle}>
            <View style={[styles.avatarInner, { backgroundColor: colors.bg_deep }]}>
              <Text style={[styles.avatarText, { color: colors.text_gold }]}>{initials}</Text>
            </View>
          </LinearGradient>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: colors.text_primary }]}>{profile.name || 'Love Test AI User'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.text_muted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
          {renderSection('main', 'NAVIGATION')}
          {renderSection('features', 'FEATURES')}
          {renderSection('account', 'ACCOUNT')}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    bottom: 0,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  drawerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontSize: fontSizes.md,
    fontWeight: '600' as const,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: fontSizes.md,
    fontWeight: '700' as const,
  },
  headerPlan: {
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scrollArea: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: '500' as const,
  },
  upgradeSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  upgradeCard: {
    padding: spacing.lg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
  },
  upgradeText: {
    fontSize: fontSizes.base,
    fontWeight: '600' as const,
    flex: 1,
  },
  upgradeDesc: {
    fontSize: fontSizes.sm,
  },
});
