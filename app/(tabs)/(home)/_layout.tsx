import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function HomeLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg_deep },
      }}
    />
  );
}
