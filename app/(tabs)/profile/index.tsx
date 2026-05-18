import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { ThemeColors, fontSizes, spacing, radius } from '@/constants/theme';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import GhostButton from '@/components/ui/GhostButton';
import GoldBadge from '@/components/ui/GoldBadge';
import GoldDivider from '@/components/ui/GoldDivider';
import DatePickerField from '@/components/ui/DatePickerField';
import SectionTitle from '@/components/ui/SectionTitle';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/ui/Toast';
import { useAppAlert } from '@/components/ui/AppAlertModal';
import { useAuthStore } from '@/store/authStore';
import { usePartnerStore } from '@/store/partnerStore';
import { useAuthGate } from '@/components/auth/AuthGateModal';
import { useFeedbackStore } from '@/store/feedbackStore';
import { buildViralCreationShareText } from '@/services/creationTemplates';
import type { SavedCreation } from '@/services/db';
import { deleteUser } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { auth as firebaseAuth, firestore } from '@/services/firebase';
import {
  loadPrefs as loadNotifPrefs,
  savePrefs as saveNotifPrefs,
  DEFAULT_NOTIF_PREFS,
  NOTIF_TIME_GRID,
  NOTIF_FREQUENCY_OPTIONS,
  type NotifFrequency,
} from '@/services/notifications';

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
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
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
    creationLeft: { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: `${c.accent_violet}18`, borderWidth: 1, borderColor: `${c.accent_violet}33` },
    creationCenter: { flex: 1, minWidth: 0 },
    creationMetaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.xs, marginBottom: 4 },
    creationType: { flexShrink: 1, fontSize: fontSizes.xs, color: c.accent_rose, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: '700' as const },
    creationDate: { fontSize: fontSizes.xs, color: c.text_muted },
    creationPreview: { fontSize: fontSizes.sm, color: c.text_secondary, lineHeight: 19 },
    creationMenuBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center' as const, justifyContent: 'center' as const },
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
    notifModalContent: {
      width: '100%' as const,
      maxWidth: 440,
      maxHeight: '92%' as const,
      backgroundColor: c.bg_surface,
      borderRadius: radius.xl,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xl,
      borderWidth: 1,
      borderColor: c.glass_border,
    },
    notifModalScroll: { gap: spacing.lg },
    notifModalHeader: { alignItems: 'center' as const, gap: spacing.xs, marginBottom: spacing.sm },
    notifModalIconWrap: {
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center' as const, justifyContent: 'center' as const,
      backgroundColor: `${c.accent_rose}1F`,
      borderWidth: 1, borderColor: `${c.accent_rose}55`,
      marginBottom: spacing.xs,
    },
    notifModalSubtitle: { fontSize: fontSizes.sm, color: c.text_muted, textAlign: 'center' as const, paddingHorizontal: spacing.lg },
    notifEnableRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.glass_border,
      backgroundColor: c.glass_fill,
    },
    notifEnableLabel: { fontSize: fontSizes.base, color: c.text_primary, fontWeight: '600' as const },
    notifEnableHint: { fontSize: fontSizes.xs, color: c.text_muted, marginTop: 2 },
    notifToggle: {
      width: 46, height: 28, borderRadius: 14,
      paddingHorizontal: 3, justifyContent: 'center' as const,
      backgroundColor: c.glass_border,
    },
    notifToggleActive: { backgroundColor: c.accent_rose },
    notifToggleKnob: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: c.text_primary,
    },
    notifSectionLabel: {
      color: c.text_muted,
      fontSize: fontSizes.xs,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
      fontWeight: '700' as const,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    notifPeriodLabel: {
      color: c.text_secondary,
      fontSize: fontSizes.xs,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    notifTimeGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.xs,
    },
    notifTimeCell: {
      width: '23%' as const,
      height: 40,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.glass_border,
      backgroundColor: c.glass_fill,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 4,
    },
    notifTimeCellActive: {
      borderColor: c.accent_rose,
      backgroundColor: 'rgba(255,61,127,0.16)',
    },
    notifTimeCellDisabled: { opacity: 0.4 },
    notifTimeCellText: { color: c.text_secondary, fontSize: 11, fontWeight: '600' as const, textAlign: 'center' as const, includeFontPadding: false, textAlignVertical: 'center' as const },
    notifTimeCellTextActive: { color: c.text_primary, fontWeight: '700' as const },
    notifFreqRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    notifFreqChip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: c.glass_border,
      backgroundColor: c.glass_fill,
    },
    notifFreqChipActive: { borderColor: c.accent_rose, backgroundColor: 'rgba(255,61,127,0.14)' },
    notifFreqChipText: { color: c.text_muted, fontSize: fontSizes.sm, fontWeight: '500' as const },
    notifFreqChipTextActive: { color: c.text_primary, fontWeight: '600' as const },
    notifSummaryCard: {
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.glass_border,
      backgroundColor: c.glass_fill,
      gap: spacing.xs,
    },
    notifSummaryLabel: { color: c.text_muted, fontSize: fontSizes.xs, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: '600' as const },
    notifSummaryValue: { color: c.text_primary, fontSize: fontSizes.base, fontWeight: '600' as const },
    detailModalCard: {
      width: '100%' as const,
      maxWidth: 460,
      maxHeight: '90%' as const,
      backgroundColor: c.bg_surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.glass_border,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xl,
      overflow: 'hidden' as const,
    },
    detailHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      marginBottom: spacing.md,
      paddingRight: spacing.xl,
    },
    detailIconWrap: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center' as const, justifyContent: 'center' as const,
      backgroundColor: `${c.accent_violet}1F`,
      borderWidth: 1, borderColor: `${c.accent_violet}40`,
    },
    detailTitleBlock: { flex: 1 },
    detailType: { color: c.accent_rose, fontSize: fontSizes.xs, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 1 },
    detailMeta: { color: c.text_muted, fontSize: fontSizes.xs, marginTop: 2 },
    detailScroll: {
      flexShrink: 1,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.glass_border,
      backgroundColor: c.glass_fill,
      marginBottom: spacing.lg,
    },
    detailScrollContent: {
      padding: spacing.lg,
    },
    detailBody: { color: c.text_primary, fontSize: fontSizes.base, lineHeight: 24 },
    detailActions: { flexDirection: 'row' as const, gap: spacing.sm, flexWrap: 'wrap' as const },
    detailActionBtn: {
      flexGrow: 1,
      flexBasis: '30%' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.xs,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: c.glass_border,
      backgroundColor: c.glass_fill,
    },
    detailActionBtnDanger: { borderColor: `${c.error}55`, backgroundColor: `${c.error}14` },
    detailActionLabel: { color: c.text_primary, fontSize: fontSizes.sm, fontWeight: '600' as const },
    detailActionLabelDanger: { color: c.error },
  });
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ notif?: string }>();
  const { colors, mode, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, savedCreations, streakData, completedTests, deleteCreation, deleteCreations, updateProfile, resetApp } = useApp();
  const toast = useToast();
  const { alert, confirm } = useAppAlert();
  const account = useAuthStore((s) => s.account);
  const signOutAccount = useAuthStore((s) => s.signOut);
  const partnerLink = usePartnerStore((s) => s.link);
  const disconnectPartner = usePartnerStore((s) => s.disconnect);
  const { openSignIn } = useAuthGate();
  const openManualFeedback = useFeedbackStore((state) => state.openManual);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editStatus, setEditStatus] = useState(profile.relationshipStatus);
  const [editDob, setEditDob] = useState(profile.dateOfBirth);
  const [showAllCreations, setShowAllCreations] = useState(false);
  const [themeSheetVisible, setThemeSheetVisible] = useState(false);
  const [selectedCreationIds, setSelectedCreationIds] = useState<string[]>([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [viewingCreation, setViewingCreation] = useState<SavedCreation | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(DEFAULT_NOTIF_PREFS.enabled);
  const [notifHour, setNotifHour] = useState(DEFAULT_NOTIF_PREFS.hour);
  const [notifMinute, setNotifMinute] = useState(DEFAULT_NOTIF_PREFS.minute);
  const [notifFrequency, setNotifFrequency] = useState<NotifFrequency>(DEFAULT_NOTIF_PREFS.frequency);

  useEffect(() => {
    void (async () => {
      try {
        const prefs = await loadNotifPrefs();
        setNotifEnabled(prefs.enabled);
        setNotifHour(prefs.hour);
        setNotifMinute(prefs.minute);
        setNotifFrequency(prefs.frequency);
      } catch (e) {
        console.log('Load notif prefs failed:', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (params?.notif === '1') {
      setNotifModalVisible(true);
      router.setParams({ notif: undefined });
    }
  }, [params?.notif, router]);

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

  const handleDeleteAccount = useCallback(() => {
    alert({
      title: 'Delete account permanently?',
      message:
        'This removes your account, your invite code, your partner pair membership, and every creation, prompt, and reflection on this device. This cannot be undone.',
      icon: 'trash-bin-outline',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              if (partnerLink) {
                try { await disconnectPartner(); } catch (e) { console.log('disconnect on delete failed:', e); }
              }
              if (firestore && partnerLink?.inviteCode) {
                try {
                  await deleteDoc(doc(firestore, 'invites', partnerLink.inviteCode));
                } catch (e) {
                  console.log('invite delete failed:', e);
                }
              }
              if (firebaseAuth?.currentUser) {
                try {
                  await deleteUser(firebaseAuth.currentUser);
                } catch (e: any) {
                  console.log('deleteUser failed:', e);
                  if (e?.code === 'auth/requires-recent-login') {
                    toast.info('Please sign in again, then retry deletion.');
                    await signOutAccount();
                    resetApp();
                    router.replace('/onboarding' as any);
                    return;
                  }
                }
              }
              await signOutAccount();
              resetApp();
              router.replace('/onboarding' as any);
              toast.success('Account deleted.');
            } catch (e) {
              console.log('delete account flow failed:', e);
              toast.info('Deletion encountered an error. Local data was cleared.');
              resetApp();
              router.replace('/onboarding' as any);
            }
          },
        },
      ],
    });
  }, [alert, partnerLink, disconnectPartner, signOutAccount, resetApp, router, toast]);

  const handleRateApp = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openManualFeedback('profile');
  }, [openManualFeedback]);

  const handlePrivacyPolicy = useCallback(() => {
    Linking.openURL('https://lovetestai.com/privacy-policy').catch(() => {
      alert({
        title: 'Privacy Policy',
        message: 'Could not open the privacy policy. Visit lovetestai.com/privacy-policy from any browser.',
        icon: 'shield-checkmark-outline',
      });
    });
  }, [alert]);

  const handleTermsOfService = useCallback(() => {
    Linking.openURL('https://lovetestai.com/terms-of-service').catch(() => {
      alert({
        title: 'Terms of Service',
        message: 'Could not open the terms of service. Visit lovetestai.com/terms-of-service from any browser.',
        icon: 'document-text-outline',
      });
    });
  }, [alert]);

  const handleNotificationPrefs = useCallback(() => {
    void Haptics.selectionAsync();
    setNotifModalVisible(true);
  }, []);

  const handleSaveNotifPrefs = useCallback(async () => {
    try {
      await saveNotifPrefs({
        enabled: notifEnabled,
        hour: notifHour,
        minute: notifMinute,
        frequency: notifFrequency,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success(notifEnabled ? 'Prompt reminders saved.' : 'Prompt reminders turned off.');
      setNotifModalVisible(false);
    } catch (e) {
      console.log('Save notif prefs failed:', e);
      toast.info('Could not save preferences.');
    }
  }, [notifEnabled, notifHour, notifMinute, notifFrequency, toast]);

  const handleTwoPlayerInfo = useCallback(() => {
    alert({
      title: 'Partner Prompts',
      message:
        'Start pairing with a Guest Account or Google, then share your 6-character pair code with someone you love. Once they accept, you both share the same daily prompt. Reflect on it together - your responses stay private to each of you until you choose to share them.',
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
                <Ionicons
                  name={account.provider === 'anonymous' ? 'person-circle-outline' : 'logo-google'}
                  size={14}
                  color={colors.accent_rose}
                />
                <Text style={styles.accountChipText} numberOfLines={1}>
                  {account.provider === 'anonymous' ? 'Guest User' : account.email}
                </Text>
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
                    if (selectionActive) {
                      toggleCreationSelection(creation.id);
                    } else {
                      void Haptics.selectionAsync();
                      setViewingCreation(creation);
                    }
                  }}
                >
                <GlassCard style={[styles.creationCard, selectedCreationIds.includes(creation.id) && styles.creationCardSelected]}>
                  <View style={styles.creationLeft}>
                    <Ionicons
                      name={(selectedCreationIds.includes(creation.id) ? 'checkmark-circle' : (TOOL_ICONS[creation.type] || 'create-outline')) as any}
                      size={18}
                      color={selectedCreationIds.includes(creation.id) ? colors.accent_rose : colors.accent_violet}
                    />
                  </View>
                  <View style={styles.creationCenter}>
                    <View style={styles.creationMetaRow}>
                      <Text style={styles.creationType} numberOfLines={1}>{creation.type}</Text>
                      <Text style={styles.creationDate} numberOfLines={1}>
                        {new Date(creation.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {creation.toName ? ` - For ${creation.toName}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.creationPreview} numberOfLines={2}>{creation.content}</Text>
                  </View>
                  <TouchableOpacity
                    disabled={selectionActive}
                    style={styles.creationMenuBtn}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setViewingCreation(creation);
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

          {renderSettingsRow('people-outline', 'Partner Prompts', handleTwoPlayerInfo)}
          {renderSettingsRow('notifications-outline', 'Notification Preferences', handleNotificationPrefs)}
          {renderSettingsRow('language-outline', 'Language', handleLanguage, 'Soon')}
          {renderSettingsRow('star-outline', 'Rate Love Test AI', handleRateApp)}
          {renderSettingsRow('shield-outline', 'Privacy Policy', handlePrivacyPolicy)}
          {renderSettingsRow('document-text-outline', 'Terms of Service', handleTermsOfService)}
          {account
            ? renderSettingsRow('log-out-outline', 'Sign Out of Account', handleSignOutAccount, undefined, true)
            : renderSettingsRow('person-circle-outline', 'Start demo or sign in', handleSignIn)}
          {renderSettingsRow('refresh-outline', 'Reset App Data', handleResetApp, undefined, true)}
          {account
            ? renderSettingsRow('trash-bin-outline', 'Delete Account', handleDeleteAccount, undefined, true)
            : null}

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
              <DatePickerField
                label="Date of Birth"
                value={editDob}
                onChange={setEditDob}
                placeholder="Select a date"
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

      <Modal visible={notifModalVisible} transparent animationType="fade" onRequestClose={() => setNotifModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.notifModalContent}>
            <TouchableOpacity onPress={() => setNotifModalVisible(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.text_secondary} />
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.notifModalScroll}>
              <View style={styles.notifModalHeader}>
                <View style={styles.notifModalIconWrap}>
                  <Ionicons name="notifications" size={26} color={colors.accent_rose} />
                </View>
                <Text style={styles.modalTitle}>Prompt Reminders</Text>
                <Text style={styles.notifModalSubtitle}>
                  Pick when you&apos;d like a fresh love prompt and how often to be nudged.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.notifEnableRow}
                onPress={() => { setNotifEnabled((v) => !v); void Haptics.selectionAsync(); }}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifEnableLabel}>Enable reminders</Text>
                  <Text style={styles.notifEnableHint}>
                    {notifEnabled ? 'You will see a gentle in-app nudge on schedule.' : 'Reminders are paused.'}
                  </Text>
                </View>
                <View style={[styles.notifToggle, notifEnabled && styles.notifToggleActive]}>
                  <View style={[styles.notifToggleKnob, { alignSelf: notifEnabled ? 'flex-end' : 'flex-start' }]} />
                </View>
              </TouchableOpacity>

              <Text style={styles.notifSectionLabel}>Preferred Time</Text>
              {(['morning', 'afternoon', 'evening', 'night'] as const).map((period) => {
                const cells = NOTIF_TIME_GRID.filter((t) => t.period === period);
                if (cells.length === 0) return null;
                const periodLabel = period[0].toUpperCase() + period.slice(1);
                return (
                  <View key={period}>
                    <Text style={styles.notifPeriodLabel}>{periodLabel}</Text>
                    <View style={styles.notifTimeGrid}>
                      {cells.map((t) => {
                        const active = t.hour === notifHour && t.minute === notifMinute;
                        return (
                          <TouchableOpacity
                            key={t.label}
                            disabled={!notifEnabled}
                            style={[
                              styles.notifTimeCell,
                              active && styles.notifTimeCellActive,
                              !notifEnabled && styles.notifTimeCellDisabled,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => {
                              setNotifHour(t.hour);
                              setNotifMinute(t.minute);
                              void Haptics.selectionAsync();
                            }}
                          >
                            <Text
                              style={[styles.notifTimeCellText, active && styles.notifTimeCellTextActive]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                            >
                              {t.label.replace(':00', '')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              <Text style={styles.notifSectionLabel}>How Often</Text>
              <View style={styles.notifFreqRow}>
                {NOTIF_FREQUENCY_OPTIONS.map((f) => {
                  const active = notifFrequency === f.value;
                  return (
                    <TouchableOpacity
                      key={f.value}
                      disabled={!notifEnabled}
                      style={[
                        styles.notifFreqChip,
                        active && styles.notifFreqChipActive,
                        !notifEnabled && styles.notifTimeCellDisabled,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => { setNotifFrequency(f.value); void Haptics.selectionAsync(); }}
                    >
                      <Text style={[styles.notifFreqChipText, active && styles.notifFreqChipTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.notifSummaryCard}>
                <Text style={styles.notifSummaryLabel}>Summary</Text>
                <Text style={styles.notifSummaryValue}>
                  {notifEnabled
                    ? `${NOTIF_FREQUENCY_OPTIONS.find((f) => f.value === notifFrequency)?.label ?? 'Every day'} · ${NOTIF_TIME_GRID.find((t) => t.hour === notifHour && t.minute === notifMinute)?.label ?? `${String(notifHour).padStart(2, '0')}:${String(notifMinute).padStart(2, '0')}`}`
                    : 'Reminders off'}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <GradientButton label="Save Preferences" onPress={handleSaveNotifPrefs} />
                <GhostButton label="Cancel" onPress={() => setNotifModalVisible(false)} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!viewingCreation}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingCreation(null)}
      >
        <View style={styles.modalOverlay}>
          {viewingCreation && (
            <View style={styles.detailModalCard}>
              <TouchableOpacity onPress={() => setViewingCreation(null)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={colors.text_secondary} />
              </TouchableOpacity>
              <View style={styles.detailHeader}>
                <View style={styles.detailIconWrap}>
                  <Ionicons
                    name={(TOOL_ICONS[viewingCreation.type] || 'create-outline') as any}
                    size={22}
                    color={colors.accent_violet}
                  />
                </View>
                <View style={styles.detailTitleBlock}>
                  <Text style={styles.detailType} numberOfLines={1}>{viewingCreation.type}</Text>
                  <Text style={styles.detailMeta} numberOfLines={1}>
                    {new Date(viewingCreation.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {viewingCreation.toName ? ` · For ${viewingCreation.toName}` : ''}
                  </Text>
                </View>
              </View>
              <ScrollView
                style={styles.detailScroll}
                contentContainerStyle={styles.detailScrollContent}
                showsVerticalScrollIndicator
                nestedScrollEnabled
              >
                <Text style={styles.detailBody}>{viewingCreation.content}</Text>
              </ScrollView>
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.detailActionBtn}
                  activeOpacity={0.8}
                  onPress={() => handleCopyCreation(viewingCreation.content)}
                >
                  <Ionicons name="copy-outline" size={18} color={colors.text_primary} />
                  <Text style={styles.detailActionLabel}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailActionBtn}
                  activeOpacity={0.8}
                  onPress={() => handleShareCreation(viewingCreation.content, viewingCreation.type)}
                >
                  <Ionicons name="share-outline" size={18} color={colors.text_primary} />
                  <Text style={styles.detailActionLabel}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailActionBtn, styles.detailActionBtnDanger]}
                  activeOpacity={0.8}
                  onPress={async () => {
                    const id = viewingCreation.id;
                    setViewingCreation(null);
                    await handleDeleteCreation(id);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text style={[styles.detailActionLabel, styles.detailActionLabelDanger]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </ScreenBackground>
  );
}
