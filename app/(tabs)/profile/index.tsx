import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { ThemeColors, fontSizes, spacing, radius } from '@/constants/theme';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import GhostButton from '@/components/ui/GhostButton';
import GoldBadge from '@/components/ui/GoldBadge';
import GoldDivider from '@/components/ui/GoldDivider';
import SectionTitle from '@/components/ui/SectionTitle';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/ui/Toast';
import { useAppAlert } from '@/components/ui/AppAlertModal';
import { useAuthStore } from '@/store/authStore';
import { useAuthGate } from '@/components/auth/AuthGateModal';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { buildViralCreationShareText } from '@/services/creationTemplates';

const STATUSES = ['Single', 'In a Relationship', "It's Complicated", 'Prefer not to say'];

const TOOL_ICONS: Record<string, string> = {
  'Love Letter': 'mail-outline',
  'Love Poem': 'book-outline',
  'Love Note': 'chatbox-outline',
  'Love Quote': 'text-outline',
  'Date Ideas': 'location-outline',
  'Starters': 'people-outline',
  'Conversation Starters': 'people-outline',
};

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
    headerTitle: { fontSize: fontSizes['2xl'], color: c.text_primary, fontWeight: '700' as const, letterSpacing: -0.5 },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
    profileCard: { padding: spacing.xl, alignItems: 'center' as const, marginBottom: spacing.lg, gap: spacing.sm },
    avatarContainer: { marginBottom: spacing.sm },
    avatarGradient: { width: 72, height: 72, borderRadius: 36, padding: 3 },
    avatarInner: { flex: 1, borderRadius: 33, backgroundColor: c.bg_deep, alignItems: 'center' as const, justifyContent: 'center' as const },
    avatarText: { fontSize: fontSizes.xl, color: c.text_gold, fontWeight: '600' as const },
    profileName: { fontSize: fontSizes.lg, color: c.text_primary, fontWeight: '700' as const },
    profileStatus: { fontSize: fontSizes.sm, color: c.text_secondary, fontStyle: 'italic' as const },
    profileDob: { fontSize: fontSizes.xs, color: c.text_muted },
    editBtn: { marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
    statsRow: { flexDirection: 'row' as const, gap: spacing.md, marginBottom: spacing.xl },
    statCard: { flex: 1, padding: spacing.lg, alignItems: 'center' as const, gap: spacing.xs },
    statNumber: { fontSize: fontSizes.xl, color: c.text_gold, fontWeight: '700' as const },
    statLabel: { fontSize: fontSizes.xs, color: c.text_muted },
    upgradeBanner: { padding: spacing.xl, marginBottom: spacing.xl, gap: spacing.md, backgroundColor: `${c.accent_violet}14` },
    upgradeTitle: { fontSize: fontSizes.lg, color: c.text_gold, fontWeight: '600' as const },
    upgradeFeatures: { gap: spacing.sm },
    upgradeFeatureRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md },
    upgradeFeatureLabel: { fontSize: fontSizes.sm, color: c.text_secondary },
    plansBtn: { borderWidth: 0, paddingVertical: spacing.xs },
    emptyCard: { padding: spacing.xl, alignItems: 'center' as const, marginBottom: spacing.xl },
    emptyText: { fontSize: fontSizes.base, color: c.text_muted, fontStyle: 'italic' as const },
    creationCard: { padding: spacing.lg, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md, marginBottom: spacing.sm },
    creationCardSelected: { borderColor: c.accent_rose, backgroundColor: `${c.accent_rose}12` },
    creationLeft: { alignItems: 'center' as const, gap: spacing.xs },
    creationType: { fontSize: fontSizes.xs, color: c.text_muted, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    creationCenter: { flex: 1 },
    creationPreview: { fontSize: fontSizes.sm, color: c.text_secondary },
    creationDate: { fontSize: fontSizes.xs, color: c.text_muted, marginTop: spacing.xs },
    divider: { marginVertical: spacing.lg },
    themeSectionTitle: { fontSize: fontSizes.sm, color: c.text_muted, fontWeight: '600' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, marginBottom: spacing.md, marginTop: spacing.sm },
    settingsRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: spacing.lg, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: c.glass_border },
    settingsLabel: { flex: 1, fontSize: fontSizes.base, color: c.text_primary },
    themeCurrentHint: { fontSize: fontSizes.sm, color: c.text_muted, fontWeight: '500' as const },
    themeSheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' as const },
    themeSheet: {
      backgroundColor: c.bg_deep,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing['2xl'],
      borderTopWidth: 1,
      borderTopColor: c.glass_border,
    },
    themeSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.glass_border, alignSelf: 'center' as const, marginBottom: spacing.lg },
    themeSheetTitle: { fontSize: fontSizes.lg, fontWeight: '700' as const, color: c.text_primary, marginBottom: spacing.md },
    themeOption: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.glass_border,
      backgroundColor: c.glass_fill,
      marginBottom: spacing.sm,
    },
    themeOptionActive: {
      borderColor: c.accent_rose,
      backgroundColor: `${c.accent_rose}14`,
    },
    themeOptionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: `${c.accent_violet}20`,
    },
    themeOptionBody: { flex: 1 },
    themeOptionLabel: { fontSize: fontSizes.base, fontWeight: '600' as const, color: c.text_primary },
    themeOptionDesc: { fontSize: fontSizes.xs, color: c.text_muted, marginTop: 2 },
    footer: { fontSize: fontSizes.xs, color: c.text_muted, textAlign: 'center' as const, marginTop: spacing['2xl'], lineHeight: 16 },
    bottomSpacer: { height: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' as const, alignItems: 'center' as const, padding: spacing.xl },
    modalContent: { width: '100%', maxWidth: 400, backgroundColor: c.bg_surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg, borderWidth: 1, borderColor: c.glass_border },
    modalTitle: { fontSize: fontSizes.xl, color: c.text_primary, fontWeight: '700' as const, textAlign: 'center' as const },
    modalFieldLabel: { fontSize: fontSizes.sm, color: c.text_secondary, fontWeight: '500' as const, marginBottom: spacing.xs },
    modalInput: { backgroundColor: c.glass_fill, borderWidth: 1, borderColor: c.glass_border, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, color: c.text_primary, fontSize: fontSizes.base },
    modalPillRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm },
    modalPill: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.full, borderWidth: 1, borderColor: c.glass_border, backgroundColor: c.glass_fill },
    modalPillSelected: { borderColor: c.accent_rose, backgroundColor: 'rgba(255,61,127,0.12)' },
    modalPillText: { fontSize: fontSizes.sm, color: c.text_muted },
    modalPillTextSelected: { color: c.text_primary, fontWeight: '500' as const },
    modalActions: { gap: spacing.md, marginTop: spacing.sm },
    modalClose: { position: 'absolute' as const, top: spacing.md, right: spacing.md, zIndex: 10 },
    apiKeySection: { marginTop: spacing.sm },
    apiKeyNote: { fontSize: fontSizes.xs, color: c.text_muted, marginTop: spacing.xs },
    apiKeyStatus: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm, marginTop: spacing.sm },
    apiKeyStatusText: { fontSize: fontSizes.sm, color: c.success },
    apiKeyStatusTextInactive: { color: c.text_muted },
    settingsSignOut: { color: c.error },
    accountChip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: `${c.accent_rose}14`,
      borderWidth: 1,
      borderColor: `${c.accent_rose}40`,
      marginTop: spacing.xs,
      maxWidth: '100%' as const,
    },
    accountChipText: { fontSize: fontSizes.xs, color: c.text_secondary, fontWeight: '500' as const },
    dobNote: { fontSize: fontSizes.xs, color: c.text_muted, marginTop: spacing.xs },
    showMoreBtn: { alignSelf: 'center' as const, marginTop: spacing.sm, marginBottom: spacing.lg },
    selectionBar: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm, marginBottom: spacing.md },
    selectionText: { flex: 1, color: c.text_secondary, fontSize: fontSizes.sm, fontWeight: '600' as const },
    selectionAction: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: c.glass_border },
    selectionActionText: { color: c.text_primary, fontSize: fontSizes.xs, fontWeight: '700' as const },
    selectionDeleteText: { color: c.error },
  });
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, mode, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, savedCreations, streakData, completedTests, deleteCreation, deleteCreations, updateProfile, resetApp } = useApp();
  const toast = useToast();
  const { alert, confirm } = useAppAlert();
  const account = useAuthStore((s) => s.account);
  const signOutAccount = useAuthStore((s) => s.signOut);
  const { openSignIn } = useAuthGate();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editStatus, setEditStatus] = useState(profile.relationshipStatus);
  const [editDob, setEditDob] = useState(profile.dateOfBirth);
  const [showAllCreations, setShowAllCreations] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [themeSheetVisible, setThemeSheetVisible] = useState(false);
  const [selectedCreationIds, setSelectedCreationIds] = useState<string[]>([]);

  const selectionActive = selectedCreationIds.length > 0;

  const initials = (profile.name || 'LT')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const displayedCreations = useMemo(() => {
    return showAllCreations ? savedCreations : savedCreations.slice(0, 5);
  }, [savedCreations, showAllCreations]);

  const formatDob = useCallback((dob: string) => {
    if (!dob) return '';
    try {
      const d = new Date(dob);
      if (isNaN(d.getTime())) return dob;
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dob;
    }
  }, []);

  const getZodiacSign = useCallback((dob: string) => {
    if (!dob) return '';
    try {
      const d = new Date(dob);
      if (isNaN(d.getTime())) return '';
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const signs = [
        { name: 'Capricorn', start: [1, 1], end: [1, 19] },
        { name: 'Aquarius', start: [1, 20], end: [2, 18] },
        { name: 'Pisces', start: [2, 19], end: [3, 20] },
        { name: 'Aries', start: [3, 21], end: [4, 19] },
        { name: 'Taurus', start: [4, 20], end: [5, 20] },
        { name: 'Gemini', start: [5, 21], end: [6, 20] },
        { name: 'Cancer', start: [6, 21], end: [7, 22] },
        { name: 'Leo', start: [7, 23], end: [8, 22] },
        { name: 'Virgo', start: [8, 23], end: [9, 22] },
        { name: 'Libra', start: [9, 23], end: [10, 22] },
        { name: 'Scorpio', start: [10, 23], end: [11, 21] },
        { name: 'Sagittarius', start: [11, 22], end: [12, 21] },
        { name: 'Capricorn', start: [12, 22], end: [12, 31] },
      ];
      for (const sign of signs) {
        if (
          (month === sign.start[0] && day >= sign.start[1]) ||
          (month === sign.end[0] && day <= sign.end[1])
        ) {
          return sign.name;
        }
      }
      return '';
    } catch {
      return '';
    }
  }, []);

  const handleDeleteCreation = useCallback(async (id: string) => {
    const ok = await confirm('Remove this creation?');
    if (!ok) return;
    deleteCreation(id);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.success('Creation removed.');
  }, [deleteCreation, confirm, toast]);

  const handleCopyCreation = useCallback(async (content: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      try { await navigator.clipboard.writeText(content); } catch { console.log('Copy failed'); }
    } else {
      await Clipboard.setStringAsync(content);
    }
    toast.success('Content copied to clipboard');
  }, [toast]);

  const handleShareCreation = useCallback(async (content: string, type: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const shareText = buildViralCreationShareText({ type, content });
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: type, text: shareText });
        } else {
          try { await navigator.clipboard.writeText(shareText); } catch { console.log('Share copy failed'); }
          toast.success('Text copied. Share it with your friends!');
        }
      } else {
        await Share.share({ message: shareText, title: type });
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.log('Share error:', error);
      }
    }
  }, [toast]);

  const toggleCreationSelection = useCallback((id: string) => {
    setSelectedCreationIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  }, []);

  const startCreationSelection = useCallback((id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCreationIds((prev) => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const clearCreationSelection = useCallback(() => {
    setSelectedCreationIds([]);
  }, []);

  const handleBulkDeleteCreations = useCallback(async () => {
    if (selectedCreationIds.length === 0) return;
    const count = selectedCreationIds.length;
    const ok = await confirm(`Delete ${count} selected creation${count === 1 ? '' : 's'}?`);
    if (!ok) return;
    deleteCreations(selectedCreationIds);
    setSelectedCreationIds([]);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success(`${count} creation${count === 1 ? '' : 's'} removed.`);
  }, [confirm, deleteCreations, selectedCreationIds, toast]);

  const handleOpenEditModal = useCallback(() => {
    setEditName(profile.name);
    setEditStatus(profile.relationshipStatus);
    setEditDob(profile.dateOfBirth);
    setShowEditModal(true);
  }, [profile]);

  const handleSaveProfile = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProfile({ ...profile, name: editName, relationshipStatus: editStatus, dateOfBirth: editDob });
    setShowEditModal(false);
    toast.success('Profile updated.');
  }, [editName, editStatus, editDob, profile, updateProfile, toast]);

  const handleSignIn = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await openSignIn();
    if (ok) toast.success('Welcome back.');
  }, [openSignIn, toast]);

  const handleSignOutAccount = useCallback(() => {
    alert({
      title: 'Sign out of account?',
      message: 'Your local notes and prompts stay on this device. Sign back in anytime to sync.',
      icon: 'log-out-outline',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOutAccount();
            toast.info('Signed out of account.');
          },
        },
      ],
    });
  }, [alert, signOutAccount, toast]);

  const handleResetApp = useCallback(() => {
    alert({
      title: 'Reset all local data?',
      message: 'This clears every creation, prompt, and reflection on this device and returns you to onboarding.',
      icon: 'trash-outline',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetApp();
            router.replace('/onboarding' as any);
          },
        },
      ],
    });
  }, [resetApp, router, alert]);

  const handleRateApp = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedbackVisible(true);
  }, []);

  const handlePrivacyPolicy = useCallback(() => {
    Linking.openURL('https://lovetestai.com/privacy').catch(() => {
      alert({
        title: 'Privacy Policy',
        message: 'Our privacy policy ensures your data stays private and secure. We do not share your personal information with third parties. All AI-generated content is processed securely and not stored on our servers.',
        icon: 'shield-checkmark-outline',
      });
    });
  }, [alert]);

  const handleNotificationPrefs = useCallback(() => {
    alert({
      title: 'Notification Preferences',
      message: 'Choose when to receive daily prompts',
      icon: 'notifications-outline',
      buttons: [
        { text: 'Daily at 9 AM (default)', onPress: () => toast.success('Daily prompts at 9 AM') },
        { text: 'Daily at 7 PM', onPress: () => toast.success('Daily prompts at 7 PM') },
        { text: 'Turn Off', style: 'destructive', onPress: () => toast.info('Daily prompt notifications turned off') },
        { text: 'Cancel', style: 'cancel' },
      ],
    });
  }, [alert, toast]);

  const handleTwoPlayerInfo = useCallback(() => {
    alert({
      title: 'Two-Player Prompts',
      message:
        'Sign in with Google, then share your 6-character pair code with someone you love. Once they accept, you both share the same daily prompt. Reflect on it together — your responses stay private to each of you until you choose to share them.',
      icon: 'people-outline',
      buttons: [
        { text: 'Open Partner Mode', onPress: () => router.push('/(tabs)/partner' as any) },
        { text: 'Close', style: 'cancel' },
      ],
    });
  }, [alert, router]);

  const handleLanguage = useCallback(() => {
    alert({
      title: 'Language',
      message: 'Multilingual prompts and AI generations are coming soon. For now everything ships in English.',
      icon: 'language-outline',
      buttons: [{ text: 'Got it', style: 'cancel' }],
    });
  }, [alert]);

  const renderSettingsRow = (icon: string, label: string, onPress: () => void, badge?: string, isDestructive?: boolean) => (
    <TouchableOpacity onPress={onPress} style={styles.settingsRow} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={20} color={isDestructive ? colors.error : colors.text_secondary} />
      <Text style={[styles.settingsLabel, isDestructive && styles.settingsSignOut]}>{label}</Text>
      {badge && <GoldBadge label={badge} />}
      <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
    </TouchableOpacity>
  );

  const THEME_OPTIONS: { label: string; value: ThemeMode; icon: string; description: string }[] = [
    { label: 'Light', value: 'light', icon: 'sunny-outline', description: 'Bright and clear all day' },
    { label: 'Dark', value: 'dark', icon: 'moon-outline', description: 'Easier on the eyes at night' },
    { label: 'System', value: 'system', icon: 'phone-portrait-outline', description: 'Match your device' },
  ];

  const currentTheme = THEME_OPTIONS.find((t) => t.value === mode) ?? THEME_OPTIONS[1];

  const zodiacSign = getZodiacSign(profile.dateOfBirth);

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <GlassCard style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[colors.accent_rose, colors.accent_violet]}
                style={styles.avatarGradient}
              >
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </LinearGradient>
            </View>
            <Text style={styles.profileName}>{profile.name || 'Love Test AI User'}</Text>
            {profile.relationshipStatus ? (
              <Text style={styles.profileStatus}>{profile.relationshipStatus}</Text>
            ) : null}
            {zodiacSign ? (
              <Text style={styles.profileDob}>{zodiacSign} · {formatDob(profile.dateOfBirth)}</Text>
            ) : profile.dateOfBirth ? (
              <Text style={styles.profileDob}>{formatDob(profile.dateOfBirth)}</Text>
            ) : null}
            {account && (
              <View style={styles.accountChip}>
                <Ionicons name="logo-google" size={14} color={colors.accent_rose} />
                <Text style={styles.accountChipText} numberOfLines={1}>{account.email}</Text>
              </View>
            )}
            <GhostButton label="Edit Profile" onPress={handleOpenEditModal} style={styles.editBtn} />
          </GlassCard>

          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <Ionicons name="create-outline" size={20} color={colors.accent_violet} />
              <Text style={styles.statNumber}>{savedCreations.length}</Text>
              <Text style={styles.statLabel}>Created</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <Ionicons name="flame" size={20} color={colors.accent_gold} />
              <Text style={styles.statNumber}>{streakData.streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <Ionicons name="ribbon-outline" size={20} color={colors.accent_rose} />
              <Text style={styles.statNumber}>{completedTests}</Text>
              <Text style={styles.statLabel}>Tests</Text>
            </GlassCard>
          </View>

          <SectionTitle title="My Creations" />
          {savedCreations.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>Your creations will appear here</Text>
            </GlassCard>
          ) : (
            <>
              {selectionActive && (
                <View style={styles.selectionBar}>
                  <Text style={styles.selectionText}>{selectedCreationIds.length} selected</Text>
                  <TouchableOpacity style={styles.selectionAction} onPress={clearCreationSelection}>
                    <Text style={styles.selectionActionText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.selectionAction} onPress={handleBulkDeleteCreations}>
                    <Text style={[styles.selectionActionText, styles.selectionDeleteText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              {displayedCreations.map((creation) => (
                <TouchableOpacity
                  key={creation.id}
                  activeOpacity={0.85}
                  onLongPress={() => startCreationSelection(creation.id)}
                  onPress={() => {
                    if (selectionActive) toggleCreationSelection(creation.id);
                  }}
                >
                <GlassCard style={[styles.creationCard, selectedCreationIds.includes(creation.id) && styles.creationCardSelected]}>
                  <View style={styles.creationLeft}>
                    <Ionicons
                      name={(selectedCreationIds.includes(creation.id) ? 'checkmark-circle' : (TOOL_ICONS[creation.type] || 'create-outline')) as any}
                      size={18}
                      color={selectedCreationIds.includes(creation.id) ? colors.accent_rose : colors.accent_violet}
                    />
                    <Text style={styles.creationType}>{creation.type}</Text>
                  </View>
                  <View style={styles.creationCenter}>
                    <Text style={styles.creationPreview} numberOfLines={1}>{creation.content}</Text>
                    <Text style={styles.creationDate}>
                      {new Date(creation.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {creation.toName ? ` · For ${creation.toName}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    disabled={selectionActive}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      alert({
                        title: 'Options',
                        icon: 'ellipsis-horizontal',
                        buttons: [
                          { text: 'Copy', onPress: () => handleCopyCreation(creation.content) },
                          { text: 'Share', onPress: () => handleShareCreation(creation.content, creation.type) },
                          { text: 'Delete', style: 'destructive', onPress: () => handleDeleteCreation(creation.id) },
                          { text: 'Cancel', style: 'cancel' },
                        ],
                      });
                    }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.text_muted} />
                  </TouchableOpacity>
                </GlassCard>
                </TouchableOpacity>
              ))}
              {savedCreations.length > 5 && (
                <GhostButton
                  label={showAllCreations ? 'Show Less' : `Show All (${savedCreations.length})`}
                  onPress={() => setShowAllCreations(!showAllCreations)}
                  style={styles.showMoreBtn}
                />
              )}
            </>
          )}

          <GoldDivider style={styles.divider} />

          <Text style={styles.themeSectionTitle}>Appearance</Text>
          <TouchableOpacity
            onPress={() => { setThemeSheetVisible(true); void Haptics.selectionAsync(); }}
            style={styles.settingsRow}
            activeOpacity={0.7}
          >
            <Ionicons name={currentTheme.icon as any} size={20} color={colors.accent_violet} />
            <Text style={styles.settingsLabel}>Theme</Text>
            <Text style={styles.themeCurrentHint}>{currentTheme.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text_muted} />
          </TouchableOpacity>

          {renderSettingsRow('people-outline', 'Two-Player Prompts', handleTwoPlayerInfo)}
          {renderSettingsRow('notifications-outline', 'Notification Preferences', handleNotificationPrefs)}
          {renderSettingsRow('language-outline', 'Language', handleLanguage, 'Soon')}
          {renderSettingsRow('star-outline', 'Rate Love Test AI', handleRateApp)}
          {renderSettingsRow('shield-outline', 'Privacy Policy', handlePrivacyPolicy)}
          {account
            ? renderSettingsRow('log-out-outline', 'Sign Out of Account', handleSignOutAccount, undefined, true)
            : renderSettingsRow('logo-google', 'Sign in with Google', handleSignIn)}
          {renderSettingsRow('refresh-outline', 'Reset App Data', handleResetApp, undefined, true)}

          <Text style={styles.footer}>
            Love Test AI is for personal growth and entertainment. Not a licensed counselling service.
          </Text>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>

      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.text_secondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View>
              <Text style={styles.modalFieldLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={colors.text_muted}
                autoCapitalize="words"
              />
            </View>
            <View>
              <Text style={styles.modalFieldLabel}>Date of Birth</Text>
              <TextInput
                style={styles.modalInput}
                value={editDob}
                onChangeText={setEditDob}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text_muted}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
              <Text style={styles.dobNote}>Used only for compatibility calculations</Text>
            </View>
            <View>
              <Text style={styles.modalFieldLabel}>Relationship Status</Text>
              <View style={styles.modalPillRow}>
                {STATUSES.map((s) => (
                  <TouchableOpacity key={s} onPress={() => { setEditStatus(s); void Haptics.selectionAsync(); }} style={[styles.modalPill, editStatus === s && styles.modalPillSelected]}>
                    <Text style={[styles.modalPillText, editStatus === s && styles.modalPillTextSelected]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalActions}>
              <GradientButton label="Save Changes" onPress={handleSaveProfile} />
              <GhostButton label="Cancel" onPress={() => setShowEditModal(false)} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <FeedbackModal visible={feedbackVisible} onClose={() => setFeedbackVisible(false)} />

      <Modal visible={themeSheetVisible} transparent animationType="slide" onRequestClose={() => setThemeSheetVisible(false)}>
        <TouchableOpacity
          style={styles.themeSheetBackdrop}
          activeOpacity={1}
          onPress={() => setThemeSheetVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.themeSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.themeSheetHandle} />
            <Text style={styles.themeSheetTitle}>Choose theme</Text>
            {THEME_OPTIONS.map((opt) => {
              const active = mode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.themeOption, active && styles.themeOptionActive]}
                  onPress={() => {
                    setThemeMode(opt.value);
                    void Haptics.selectionAsync();
                    setThemeSheetVisible(false);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.themeOptionIconWrap}>
                    <Ionicons name={opt.icon as any} size={22} color={active ? colors.accent_rose : colors.accent_violet} />
                  </View>
                  <View style={styles.themeOptionBody}>
                    <Text style={styles.themeOptionLabel}>{opt.label}</Text>
                    <Text style={styles.themeOptionDesc}>{opt.description}</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={22} color={colors.accent_rose} />}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenBackground>
  );
}
