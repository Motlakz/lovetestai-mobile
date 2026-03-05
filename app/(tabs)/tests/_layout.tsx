import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function TestsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg_deep },
        animation: 'slide_from_right',
      }}
    />
  );
}
