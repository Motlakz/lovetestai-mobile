import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

interface Particle {
  x: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

function HeartShape({ size, opacity, color }: { size: number; opacity: number; color: string }) {
  const scale = size / 24;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={HEART_PATH}
        fill={color}
        opacity={opacity}
        scale={scale}
      />
    </Svg>
  );
}

export default function HeartParticles() {
  const { colors } = useTheme();

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 10 }, () => ({
      x: Math.random() * SCREEN_WIDTH,
      size: 14 + Math.random() * 8,
      opacity: 0.08 + Math.random() * 0.10,
      duration: 7000 + Math.random() * 6000,
      delay: Math.random() * 5000,
    }));
  }, []);

  const anims = useRef(particles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    particles.forEach((p, i) => {
      const animate = () => {
        anims[i].setValue(0);
        Animated.timing(anims[i], {
          toValue: 1,
          duration: p.duration,
          delay: p.delay,
          useNativeDriver: true,
        }).start(() => {
          animate();
        });
      };
      animate();
    });
  }, [anims, particles]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => {
        const translateY = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [SCREEN_HEIGHT + 20, -60],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: p.x,
                transform: [{ translateY }],
              },
            ]}
          >
            <HeartShape size={p.size} opacity={p.opacity} color={colors.accent_rose} />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden' as const,
  },
  particle: {
    position: 'absolute' as const,
  },
});
