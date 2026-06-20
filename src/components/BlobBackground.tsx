import React from 'react';
import { View, Dimensions, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useAppSelector } from '../store/store';
import { selectIsDark } from '../store/themeSlice';
import { COLORS } from '../config/constants';

const { width, height } = Dimensions.get('window');

interface BlobProps {
  color: string;
  size: number;
  opacity: number;
  style: ViewStyle;
}

function GlowBlob({ color, size, opacity, style }: BlobProps) {
  const gradientId = `grad-${color.replace('#', '')}-${Math.round(opacity * 100)}`;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg height="100%" width="100%" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50%" cy="50%" r="50%" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

export default function BlobBackground() {
  const isDark = useAppSelector(selectIsDark);

  const opacity1 = isDark ? 0.35 : 0.2;
  const opacity2 = isDark ? 0.28 : 0.16;
  const opacity3 = isDark ? 0.2 : 0.12;

  const purpleColor = isDark ? COLORS.dark.blobPurple : COLORS.light.blobPurple;
  const yellowColor = isDark ? COLORS.dark.blobYellow : COLORS.light.blobYellow;

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
    >
      <GlowBlob
        color={COLORS.primary}
        size={width * 0.75}
        opacity={opacity1}
        style={{
          position: 'absolute',
          top: -width * 0.25,
          left: -width * 0.25,
        }}
      />

      <GlowBlob
        color={purpleColor}
        size={width * 0.7}
        opacity={opacity2}
        style={{
          position: 'absolute',
          bottom: height * 0.1,
          right: -width * 0.2,
        }}
      />

      <GlowBlob
        color={yellowColor}
        size={width * 0.55}
        opacity={opacity3}
        style={{
          position: 'absolute',
          top: height * 0.3,
          left: -width * 0.15,
        }}
      />
    </View>
  );
}
