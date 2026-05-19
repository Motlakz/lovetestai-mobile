import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { fontSizes, spacing, radius } from '@/constants/theme';
import type { LegalDoc } from '@/constants/legalContent';
import GhostButton from './GhostButton';

interface LegalSheetProps {
  visible: boolean;
  doc: LegalDoc | null;
  onClose: () => void;
}

export default function LegalSheet({ visible, doc, onClose }: LegalSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const openExternal = () => {
    if (!doc) return;
    Linking.openURL(doc.url).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay_dark }]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.bg_surface,
              borderColor: colors.glass_border,
              paddingTop: spacing.lg,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text_primary }]}>{doc?.title}</Text>
              {doc?.lastUpdated ? (
                <Text style={[styles.updated, { color: colors.text_muted }]}>
                  Last updated: {doc.lastUpdated}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text_secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
          >
            {doc?.intro ? (
              <Text style={[styles.paragraph, { color: colors.text_secondary, marginBottom: spacing.lg }]}>
                {doc.intro}
              </Text>
            ) : null}

            {doc?.sections.map((section, i) => (
              <View key={i} style={{ marginBottom: spacing.lg }}>
                <Text style={[styles.sectionHeading, { color: colors.text_primary }]}>{section.heading}</Text>
                {section.paragraphs?.map((p, j) => (
                  <Text key={`p-${j}`} style={[styles.paragraph, { color: colors.text_secondary }]}>
                    {p}
                  </Text>
                ))}
                {section.bullets?.map((b, j) => (
                  <View key={`b-${j}`} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.accent_rose }]}>•</Text>
                    <Text style={[styles.paragraph, { color: colors.text_secondary, flex: 1 }]}>{b}</Text>
                  </View>
                ))}
                {section.subsections?.map((sub, j) => (
                  <View key={`sub-${j}`} style={{ marginTop: spacing.md }}>
                    <Text style={[styles.subheading, { color: colors.text_primary }]}>{sub.subheading}</Text>
                    {sub.paragraphs?.map((p, k) => (
                      <Text key={`sp-${k}`} style={[styles.paragraph, { color: colors.text_secondary }]}>
                        {p}
                      </Text>
                    ))}
                    {sub.bullets?.map((b, k) => (
                      <View key={`sb-${k}`} style={styles.bulletRow}>
                        <Text style={[styles.bulletDot, { color: colors.accent_rose }]}>•</Text>
                        <Text style={[styles.paragraph, { color: colors.text_secondary, flex: 1 }]}>{b}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <GhostButton
              label={Platform.OS === 'web' ? 'View on the web' : 'Open in browser'}
              onPress={openExternal}
              icon={<Ionicons name="open-outline" size={16} color={colors.text_secondary} />}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' as const },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    maxHeight: '90%' as const,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF22', alignSelf: 'center' as const, marginBottom: spacing.md },
  header: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: spacing.md, marginBottom: spacing.md },
  title: { fontSize: fontSizes.xl, fontWeight: '700' as const },
  updated: { fontSize: fontSizes.xs, marginTop: 2 },
  closeBtn: { padding: spacing.xs },
  sectionHeading: { fontSize: fontSizes.lg, fontWeight: '700' as const, marginBottom: spacing.sm },
  subheading: { fontSize: fontSizes.base, fontWeight: '600' as const, marginBottom: spacing.xs },
  paragraph: { fontSize: fontSizes.sm, lineHeight: 22, marginBottom: spacing.sm },
  bulletRow: { flexDirection: 'row' as const, gap: spacing.sm, paddingLeft: spacing.xs },
  bulletDot: { fontSize: fontSizes.sm, lineHeight: 22 },
  footer: { paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#FFFFFF11', alignItems: 'center' as const },
});
