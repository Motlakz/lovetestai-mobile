import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { fontSizes } from '@/constants/theme';

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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg_elevated,
          borderTopWidth: 1,
          borderTopColor: colors.glass_border,
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : 10),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          paddingTop: 8,
        },
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
        name="(create)"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="create-outline" activeName="create" color={color} focused={focused} activeColor={colors.accent_rose} />
          ),
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
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chatbubble-outline" activeName="chatbubble" color={color} focused={focused} activeColor={colors.accent_rose} />
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
    marginTop: -20,
  },
  dailyGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
  },
  dailyLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '500' as const,
    marginTop: 4,
  },
});
