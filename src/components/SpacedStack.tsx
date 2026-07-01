import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { SCROLL_GAP_TOUCH } from './scrollUtils';

interface SpacedStackProps {
  children: React.ReactNode;
  gap: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Vertical stack with touch-safe spacing. Inserts real spacer views between items
 * so scroll gestures work in the gap area on Android.
 */
export default function SpacedStack({ children, gap, style }: SpacedStackProps) {
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={[{ width: '100%' }, style]} collapsable={false} pointerEvents="box-none">
      {items.map((child, index) => (
        <React.Fragment key={index}>
          <View style={{ width: '100%' }} collapsable={false}>
            {child}
          </View>
          {index < items.length - 1 ? (
            <View
              style={[{ height: gap, width: '100%' }, SCROLL_GAP_TOUCH]}
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
      style={[{ height, width: '100%' }, SCROLL_GAP_TOUCH]}
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
        style={[{ height: gap, width: '100%' }, SCROLL_GAP_TOUCH]}
        collapsable={false}
      />
    </View>
  );
}
