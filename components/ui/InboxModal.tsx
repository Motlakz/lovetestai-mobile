import React, { useCallback, useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { fontSizes, radius, spacing } from '@/constants/theme';
import { useInboxStore } from '@/store/inboxStore';
import type { InboxItem, InboxKind } from '@/services/db';

const KIND_ICONS: Record<InboxKind, keyof typeof Ionicons.glyphMap> = {
  daily_prompt: 'sunny-outline',
  creation_saved: 'bookmark-outline',
  creation_generated: 'sparkles-outline',
  partner_paired: 'people-outline',
  partner_prompt: 'chatbubble-ellipses-outline',
  partner_reflection: 'heart-outline',
  partner_response: 'mail-unread-outline',
  system: 'information-circle-outline',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

function relativeTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(t).toLocaleDateString();
}

export default function InboxModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const items = useInboxStore(s => s.items);
  const markRead = useInboxStore(s => s.markRead);
  const markAllRead = useInboxStore(s => s.markAllRead);
  const remove = useInboxStore(s => s.remove);
  const clear = useInboxStore(s => s.clear);

  const unread = useMemo(() => items.reduce((n, i) => n + (i.read ? 0 : 1), 0), [items]);

  const handleItemPress = useCallback((item: InboxItem) => {
    void Haptics.selectionAsync();
    if (!item.read) void markRead(item.id, true);
    if (item.route) {
      onClose();
      router.push(item.route as any);
    }
  }, [markRead, onClose, router]);

  const handleDelete = useCallback((id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void remove(id);
  }, [remove]);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[styles.sheet, { backgroundColor: colors.bg_surface, borderColor: colors.glass_border }]}
        >
          <View style={[styles.header, { borderBottomColor: colors.glass_border }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Notifications</Text>
              {unread > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.accent_rose }]}>
                  <Text style={styles.unreadBadgeText}>{unread}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              {unread > 0 && (
                <TouchableOpacity onPress={() => void markAllRead()} hitSlop={8}>
                  <Text style={[styles.headerAction, { color: colors.accent_violet }]}>Mark all read</Text>
                </TouchableOpacity>
              )}
              {items.length > 0 && (
                <TouchableOpacity onPress={() => void clear()} hitSlop={8}>
                  <Text style={[styles.headerAction, { color: colors.text_muted }]}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.text_muted} />
              </TouchableOpacity>
            </View>
          </View>

          {items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={36} color={colors.text_muted} />
              <Text style={[styles.emptyText, { color: colors.text_muted }]}>You're all caught up.</Text>
            </View>
          ) : (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              {items.map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                  style={[
                    styles.row,
                    { backgroundColor: colors.bg_elevated, borderColor: colors.glass_border },
                    !item.read && { borderLeftColor: colors.accent_rose, borderLeftWidth: 3 },
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: colors.glass_fill }]}>
                    <Ionicons
                      name={(item.icon as any) ?? KIND_ICONS[item.kind] ?? 'notifications-outline'}
                      size={18}
                      color={item.read ? colors.text_muted : colors.accent_rose}
                    />
                  </View>
                  <View style={styles.rowContent}>
                    <View style={styles.rowHeader}>
                      <Text style={[styles.rowTitle, { color: colors.text_primary }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.rowTime, { color: colors.text_muted }]}>{relativeTime(item.createdAt)}</Text>
                    </View>
                    <Text style={[styles.rowBody, { color: colors.text_secondary }]} numberOfLines={2}>
                      {item.body}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={8} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.text_muted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '85%',
    minHeight: '50%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  unreadBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerAction: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSizes.sm,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowTitle: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  rowTime: {
    fontSize: fontSizes.xs,
  },
  rowBody: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
});
