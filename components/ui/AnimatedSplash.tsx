import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

const PARTICLE_COUNT = 8;
const RING_COUNT = 2;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  color: string;
  delay: number;
}

interface Props {
  onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: Props) {
  const { colors, isDark } = useTheme();

  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const heartRotate = useRef(new Animated.Value(0)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;

  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;

  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleY = useRef(new Animated.Value(20)).current;

  const fadeOut = useRef(new Animated.Value(1)).current;

  const ringAnims = useRef(
    Array.from({ length: RING_COUNT }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0.45),
    }))
  ).current;

  const shimmerX = useRef(new Animated.Value(-W)).current;

  const bgGrad1 = useRef(new Animated.Value(0)).current;
  const bgGrad2 = useRef(new Animated.Value(0)).current;

  const particles = useRef<Particle[]>(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const radius = 86 + (i % 2) * 18;
      const cx = W / 2;
      const cy = H / 2 - 40;
      const startRadius = 46 + (i % 3) * 8;
      return {
        x: new Animated.Value(cx + Math.cos(angle) * startRadius),
        y: new Animated.Value(cy + Math.sin(angle) * startRadius * 0.65),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0),
        startX: cx + Math.cos(angle) * startRadius,
        startY: cy + Math.sin(angle) * startRadius * 0.65,
        endX: cx + Math.cos(angle + 0.28) * radius,
        endY: cy + Math.sin(angle + 0.28) * radius * 0.62,
        size: 3 + (i % 3) * 1.2,
        color: [
          '#FF7AA8', '#CFA8FF', '#FFDDA1', '#F7B8CF',
        ][i % 4],
        delay: i * 90,
      };
    })
  ).current;

  const starbursts = useRef(
    Array.from({ length: 4 }, (_, i) => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotation: new Animated.Value(0),
      angle: 45 + (i / 4) * 360,
    }))
  ).current;

  useEffect(() => {
    const bgAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(bgGrad1, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(bgGrad1, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    bgAnim.start();

    const bgAnim2 = Animated.loop(
      Animated.sequence([
        Animated.timing(bgGrad2, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(bgGrad2, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    bgAnim2.start();

    const glowAnim = Animated.parallel([
      Animated.timing(glowOpacity, {
        toValue: 0.6,
        duration: 800,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(glowScale, {
        toValue: 1.2,
        duration: 1000,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const heartEntrance = Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heartOpacity, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heartRotate, {
        toValue: 1,
        duration: 800,
        delay: 300,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]);

    const ringAnimations = ringAnims.map((ring, i) =>
      Animated.parallel([
        Animated.timing(ring.scale, {
          toValue: 2.1 + i * 0.45,
          duration: 1500,
          delay: 600 + i * 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ring.opacity, {
          toValue: 0,
          duration: 1500,
          delay: 600 + i * 200,
          useNativeDriver: true,
        }),
      ])
    );

    const particleAnims = particles.map((p) =>
      Animated.parallel([
        Animated.timing(p.opacity, {
          toValue: 0.62,
          duration: 650,
          delay: 700 + p.delay,
          useNativeDriver: true,
        }),
        Animated.spring(p.scale, {
          toValue: 1,
          friction: 7,
          tension: 45,
          delay: 700 + p.delay,
          useNativeDriver: true,
        }),
        Animated.timing(p.x, {
          toValue: p.endX,
          duration: 1800,
          delay: 700 + p.delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: p.endY,
          duration: 1800,
          delay: 700 + p.delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const particleFadeOut = particles.map((p) =>
      Animated.timing(p.opacity, {
        toValue: 0,
        duration: 800,
        delay: 0,
        useNativeDriver: true,
      })
    );

    const starburstAnims = starbursts.map((s, i) =>
      Animated.parallel([
        Animated.timing(s.opacity, {
          toValue: 0.38,
          duration: 500,
          delay: 1000 + i * 140,
          useNativeDriver: true,
        }),
        Animated.spring(s.scale, {
          toValue: 1,
          friction: 7,
          tension: 55,
          delay: 1000 + i * 140,
          useNativeDriver: true,
        }),
        Animated.timing(s.rotation, {
          toValue: 1,
          duration: 900,
          delay: 1000 + i * 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const starburstFade = starbursts.map((s) =>
      Animated.timing(s.opacity, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      })
    );

    const textReveal = Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(titleY, {
          toValue: 0,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleY, {
          toValue: 0,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
    ]);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heartPulse, {
          toValue: 1.045,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(heartPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const shimmerAnim = Animated.timing(shimmerX, {
      toValue: W,
      duration: 1200,
      delay: 1600,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    const exitAnim = Animated.timing(fadeOut, {
      toValue: 0,
      duration: 500,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });

    Animated.sequence([
      Animated.parallel([
        glowAnim,
        heartEntrance,
        ...ringAnimations,
        ...particleAnims,
        ...starburstAnims,
      ]),
      Animated.parallel([
        textReveal,
        shimmerAnim,
      ]),
      Animated.parallel([
        ...particleFadeOut,
        ...starburstFade,
      ]),
      Animated.delay(600),
      pulseLoop,
    ]).start();

    const exitTimer = setTimeout(() => {
      pulseLoop.stop();
      exitAnim.start(() => {
        onFinish();
      });
    }, 3800);

    return () => {
      clearTimeout(exitTimer);
      bgAnim.stop();
      bgAnim2.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heartRotation = heartRotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-15deg', '5deg', '0deg'],
  });

  const orb1Top = bgGrad1.interpolate({
    inputRange: [0, 1],
    outputRange: [H * 0.15, H * 0.25],
  });

  const orb1Left = bgGrad1.interpolate({
    inputRange: [0, 1],
    outputRange: [W * 0.1, W * 0.3],
  });

  const orb2Top = bgGrad2.interpolate({
    inputRange: [0, 1],
    outputRange: [H * 0.55, H * 0.65],
  });

  const orb2Left = bgGrad2.interpolate({
    inputRange: [0, 1],
    outputRange: [W * 0.5, W * 0.7],
  });

  const bgColor = isDark ? '#0D0610' : '#FEF6F8';

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor, opacity: fadeOut }]}>
      <Animated.View
        style={[
          styles.orb,
          {
            top: orb1Top,
            left: orb1Left,
            backgroundColor: isDark ? 'rgba(255,61,127,0.12)' : 'rgba(255,61,127,0.08)',
            width: 260,
            height: 260,
            borderRadius: 130,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            top: orb2Top,
            left: orb2Left,
            backgroundColor: isDark ? 'rgba(180,79,255,0.10)' : 'rgba(142,36,170,0.06)',
            width: 200,
            height: 200,
            borderRadius: 100,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.glowCircle,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      >
        <Svg width={240} height={240} viewBox="0 0 240 240">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.accent_rose} stopOpacity="0.4" />
              <Stop offset="50%" stopColor={colors.accent_violet} stopOpacity="0.15" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="120" cy="120" r="120" fill="url(#glow)" />
        </Svg>
      </Animated.View>

      {ringAnims.map((ring, i) => (
        <Animated.View
          key={`ring-${i}`}
          style={[
            styles.ring,
            {
              borderColor: i === 0
                ? colors.accent_rose
                : i === 1
                ? colors.accent_violet
                : colors.accent_gold,
              opacity: ring.opacity,
              transform: [{ scale: ring.scale }],
            },
          ]}
        />
      ))}

      {particles.map((p, i) => (
        <Animated.View
          key={`particle-${i}`}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: [
                { translateX: Animated.subtract(p.x, new Animated.Value(p.size / 2)) },
                { translateY: Animated.subtract(p.y, new Animated.Value(p.size / 2)) },
                { scale: p.scale },
              ],
            },
          ]}
        />
      ))}

      {starbursts.map((s, i) => {
        const dist = 100;
        const rad = (s.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * dist;
        const ty = Math.sin(rad) * dist;
        const rot = s.rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${s.angle + 90}deg`],
        });
        return (
          <Animated.View
            key={`star-${i}`}
            style={[
              styles.starburst,
              {
                opacity: s.opacity,
                transform: [
                  { translateX: tx },
                  { translateY: ty },
                  { scale: s.scale },
                  { rotate: rot },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.starLine,
                {
                  backgroundColor: i % 2 === 0 ? colors.accent_gold : colors.accent_rose,
                },
              ]}
            />
          </Animated.View>
        );
      })}

      <Animated.View
        style={[
          styles.heartContainer,
          {
            opacity: heartOpacity,
            transform: [
              { scale: Animated.multiply(heartScale, heartPulse) },
              { rotate: heartRotation },
            ],
          },
        ]}
      >
        <Svg width={100} height={90} viewBox="0 0 100 90">
          <Defs>
            <RadialGradient id="heartGrad" cx="50%" cy="40%" r="60%">
              <Stop offset="0%" stopColor={colors.grad_rose_start} />
              <Stop offset="100%" stopColor={colors.grad_rose_end} />
            </RadialGradient>
          </Defs>
          <Path
            d="M50 85 C25 65 0 50 0 30 C0 13 13 0 30 0 C39 0 47 4 50 12 C53 4 61 0 70 0 C87 0 100 13 100 30 C100 50 75 65 50 85Z"
            fill="url(#heartGrad)"
          />
          <Path
            d="M35 20 C30 15 22 18 22 26 C22 32 35 40 35 40"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerX }],
          },
        ]}
      >
        <View style={[styles.shimmerInner, {
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.4)',
        }]} />
      </Animated.View>

      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleY }],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.title,
            { color: colors.text_primary },
          ]}
        >
          LoveTest AI
        </Animated.Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.subtitleContainer,
          {
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleY }],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.subtitle,
            { color: colors.text_secondary },
          ]}
        >
          Discover your heart&apos;s language
        </Animated.Text>
      </Animated.View>

      <View style={styles.bottomDots}>
        {[0, 1, 2].map((i) => (
          <BottomDot key={i} index={i} color={colors.accent_rose} />
        ))}
      </View>
    </Animated.View>
  );
}

function BottomDot({ index, color }: { index: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 200 + 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1.2],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    ...(Platform.OS === 'web'
      ? { filter: 'blur(60px)' }
      : {}),
  } as any,
  glowCircle: {
    position: 'absolute',
    top: H / 2 - 160,
    left: W / 2 - 120,
  },
  ring: {
    position: 'absolute',
    top: H / 2 - 80,
    left: W / 2 - 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  starburst: {
    position: 'absolute',
    top: H / 2 - 40,
    left: W / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starLine: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  heartContainer: {
    position: 'absolute',
    top: H / 2 - 85,
    left: W / 2 - 50,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: W,
    height: H,
  },
  shimmerInner: {
    width: 80,
    height: H,
    transform: [{ skewX: '-20deg' }],
    marginLeft: W / 2 - 40,
  },
  textContainer: {
    position: 'absolute',
    top: H / 2 + 60,
    alignItems: 'center',
    width: W,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    letterSpacing: 2,
    textAlign: 'center' as const,
  },
  subtitleContainer: {
    position: 'absolute',
    top: H / 2 + 108,
    alignItems: 'center',
    width: W,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: 1,
    textAlign: 'center' as const,
  },
  bottomDots: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row' as const,
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
