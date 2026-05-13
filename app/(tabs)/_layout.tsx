import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { fontSizes } from '@/constants/theme';
import DrawerMenu from '@/components/ui/DrawerMenu';
import { useFeedbackStore } from '@/store/feedbackStore';

interface TabIconProps {
  name: string;
  activeName: string;
  color: string;
  focused: boolean;
  activeColor: string;
}

function TabIcon({ name, activeName, color, focused, activeColor }: TabIconProps) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={(focused ? activeName : name) as any}
        size={22}
        color={color}
      />
      {focused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const openManualFeedback = useFeedbackStore((state) => state.openManual);

  const openDrawer = useCallback(() => setDrawerVisible(true), []);
  const closeDrawer = useCallback(() => setDrawerVisible(false), []);
  const openFeedback = useCallback(() => openManualFeedback('drawer'), [openManualFeedback]);

  const bottomSafe = useMemo(() => {
    if (insets.bottom > 0) return insets.bottom;
    if (Platform.OS === 'web') return 12;
    return 8;
  }, [insets.bottom]);

  const tabBarStyleMemo = useMemo(() => ({
    backgroundColor: colors.bg_elevated,
    borderTopWidth: 1,
    borderTopColor: colors.glass_border,
    height: 58 + bottomSafe,
    paddingBottom: bottomSafe,
    paddingTop: 6,
  }), [colors.bg_elevated, colors.glass_border, bottomSafe]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: tabBarStyleMemo,
          tabBarActiveTintColor: colors.text_gold,
          tabBarInactiveTintColor: colors.text_muted,
          tabBarLabelStyle: {
            fontSize: fontSizes.xs,
            fontWeight: '500' as const,
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="home-outline" activeName="home" color={color} focused={focused} activeColor={colors.accent_rose} />
            ),
            headerShown: false,
          }}
          listeners={{
            tabLongPress: openDrawer,
          }}
        />
        <Tabs.Screen
          name="tests"
          options={{
            title: 'Test',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="heart-outline" activeName="heart" color={color} focused={focused} activeColor={colors.accent_rose} />
            ),
          }}
        />
        <Tabs.Screen
          name="daily"
          options={{
            title: 'Daily',
            tabBarIcon: ({ focused }) => (
              <View style={styles.dailyContainer}>
                <LinearGradient
                  colors={[colors.grad_rose_start, colors.grad_violet_end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.dailyGradient, { borderColor: colors.accent_gold }, shadows.rose_glow]}
                >
                  <Ionicons
                    name={focused ? 'calendar' : 'calendar-outline'}
                    size={22}
                    color={colors.text_on_grad}
                  />
                </LinearGradient>
              </View>
            ),
            tabBarLabel: ({ focused }) => (
              <Text style={[styles.dailyLabel, { color: focused ? colors.text_gold : colors.text_muted }]}>Daily</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="partner"
          options={{
            title: 'Pair',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <FontAwesome5 name="grin-hearts" size={20} color={color} solid={focused} />
                {focused && <View style={[styles.activeDot, { backgroundColor: colors.accent_rose }]} />}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Me',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="person-outline" activeName="person" color={color} focused={focused} activeColor={colors.accent_rose} />
            ),
          }}
        />
      </Tabs>

      <DrawerMenu visible={drawerVisible} onClose={closeDrawer} onOpenFeedback={openFeedback} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center' as const,
    gap: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  dailyContainer: {
    alignItems: 'center' as const,
    marginTop: -16,
  },
  dailyGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
  },
  dailyLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '500' as const,
    marginTop: 2,
  },
});
