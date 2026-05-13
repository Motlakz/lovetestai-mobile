import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { fontSizes, radius, spacing } from '@/constants/theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  duration?: number;
  action?: { label: string; onPress: () => void };
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  action?: ToastOptions['action'];
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _idCounter = 0;
const nextId = () => `toast-${Date.now()}-${++_idCounter}`;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType = 'info', options?: ToastOptions): string => {
    const id = nextId();
    const item: ToastItem = {
      id,
      message,
      type,
      duration: options?.duration ?? 3000,
      action: options?.action,
    };
    setItems(prev => [...prev, item]);
    return id;
  }, []);

  const api = useMemo<ToastContextValue>(() => ({
    show,
    success: (m, o) => show(m, 'success', o),
    error: (m, o) => show(m, 'error', o),
    info: (m, o) => show(m, 'info', o),
    warning: (m, o) => show(m, 'warning', o),
    dismiss,
  }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.viewport, { bottom: insets.bottom + spacing.lg }]}>
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </View>
  );
}

const TYPE_ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
  warning: 'warning',
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const { colors } = useTheme();
  const translate = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const typeColor = useMemo(() => {
    switch (item.type) {
      case 'success': return colors.success;
      case 'error': return colors.error;
      case 'warning': return colors.accent_gold;
      case 'info':
      default: return colors.accent_violet;
    }
  }, [item.type, colors]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translate, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 220 }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translate, { toValue: 60, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, item.duration);

    return () => clearTimeout(timer);
  }, [translate, opacity, item.duration, onDismiss]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.bg_elevated,
          borderColor: colors.glass_border,
          opacity,
          transform: [{ translateY: translate }],
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: typeColor }]} />
      <Ionicons name={TYPE_ICONS[item.type]} size={20} color={typeColor} />
      <Text style={[styles.message, { color: colors.text_primary }]} numberOfLines={2}>
        {item.message}
      </Text>
      {item.action && (
        <Pressable
          onPress={() => { item.action?.onPress(); onDismiss(); }}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.actionLabel, { color: typeColor }]}>{item.action.label}</Text>
        </Pressable>
      )}
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={16} color={colors.text_muted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  message: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: '500',
    lineHeight: 18,
  },
  action: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});
