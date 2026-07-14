import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';

interface SpacedStackProps {
  children: React.ReactNode;
  gap: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Vertical stack with touch-safe spacing.
 *
 * IMPORTANT: The outer View must NOT use pointerEvents="box-none".
 * box-none means the View itself cannot receive touches, only its children can.
 * On Android this causes the gap spacer Views (between cards) to be
 * non-touchable — the scroll gesture starts in a dead zone, finds no
 * touch handler, and falls through to the navigator which ignores it.
 *
 * No pointerEvents prop = default "auto" = the View and all children receive
 * touches normally, and the ScrollView parent correctly claims scroll gestures
 * that start anywhere in this area (including gaps between cards).
 */
export default function SpacedStack({ children, gap, style }: SpacedStackProps) {
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={[{ width: '100%' }, style]} collapsable={false}>
      {items.map((child, index) => (
        <React.Fragment key={index}>
          <View style={{ width: '100%' }} collapsable={false}>
            {child}
          </View>
          {index < items.length - 1 ? (
            <View
              style={{ height: gap, width: '100%' }}
              collapsable={false}
            />
          ) : null}
        </React.Fragment>
      ))}
    </View>
  );
}

/**
 * FlatList separator — a real row between items so gaps scroll reliably.
 */
export function ScrollGap({ height }: { height: number }) {
  return (
    <View
      style={{ height, width: '100%' }}
      collapsable={false}
    />
  );
}

interface SectionHeadingProps {
  title: string;
  className?: string;
  gap?: number;
}

/** Section title with a real spacer before the card below it. */
export function SectionHeading({ title, className = '', gap = 16 }: SectionHeadingProps) {
  return (
    <View style={{ width: '100%' }} collapsable={false}>
      <Text className={`text-lg font-semibold text-text dark:text-text-dark ${className}`}>
        {title}
      </Text>
      <View
        style={{ height: gap, width: '100%' }}
        collapsable={false}
      />
    </View>
  );
}
