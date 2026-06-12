import React, { useEffect } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useAppSelector } from '../store/store';
import { selectIsDark } from '../store/themeSlice';
import { COLORS } from '../config/constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface BlobProps {
  color: string;
  size: number;
  opacity: number;
  style: any;
}

function GlowBlob({ color, size, opacity, style }: BlobProps) {
  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Svg height="100%" width="100%" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient
            id={`grad-${color.replace('#', '')}`}
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
          >
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50%" cy="50%" r="50%" fill={`url(#grad-${color.replace('#', '')})`} />
      </Svg>
    </Animated.View>
  );
}

export default function BlobBackground() {
  const isDark = useAppSelector(selectIsDark);

  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);
  const blob3X = useSharedValue(0);
  const blob3Y = useSharedValue(0);

  useEffect(() => {
    // Blob 1 Animation Loop
    blob1X.value = withRepeat(
      withSequence(
        withTiming(width * 0.15, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-width * 0.1, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 12000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(-height * 0.08, { duration: 13000, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 0.05, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 13000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Blob 2 Animation Loop
    blob2X.value = withRepeat(
      withSequence(
        withTiming(-width * 0.12, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
        withTiming(width * 0.08, { duration: 13000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 14000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.07, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-height * 0.06, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 15000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Blob 3 Animation Loop
    blob3X.value = withRepeat(
      withSequence(
        withTiming(width * 0.08, { duration: 16000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-width * 0.15, { duration: 16000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 16000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob3Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.05, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-height * 0.08, { duration: 17000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 15000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animBlob1 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob1X.value }, { translateY: blob1Y.value }],
  }));

  const animBlob2 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob2X.value }, { translateY: blob2Y.value }],
  }));

  const animBlob3 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob3X.value }, { translateY: blob3Y.value }],
  }));

  // Elevated opacities to ensure visibility through the radial gradient fade
  const opacity1 = isDark ? 0.35 : 0.20;
  const opacity2 = isDark ? 0.28 : 0.16;
  const opacity3 = isDark ? 0.20 : 0.12;

  const purpleColor = isDark ? COLORS.dark.blobPurple : COLORS.light.blobPurple;
  const yellowColor = isDark ? COLORS.dark.blobYellow : COLORS.light.blobYellow;

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
    >
      {/* Blob 1 - Orange */}
      <GlowBlob
        color={COLORS.primary}
        size={width * 0.75}
        opacity={opacity1}
        style={[
          {
            position: 'absolute',
            top: -width * 0.25,
            left: -width * 0.25,
          },
          animBlob1,
        ]}
      />

      {/* Blob 2 - Purple */}
      <GlowBlob
        color={purpleColor}
        size={width * 0.7}
        opacity={opacity2}
        style={[
          {
            position: 'absolute',
            bottom: height * 0.1,
            right: -width * 0.2,
          },
          animBlob2,
        ]}
      />

      {/* Blob 3 - Yellow */}
      <GlowBlob
        color={yellowColor}
        size={width * 0.55}
        opacity={opacity3}
        style={[
          {
            position: 'absolute',
            top: height * 0.3,
            left: -width * 0.15,
          },
          animBlob3,
        ]}
      />
    </View>
  );
}
