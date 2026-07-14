import React from 'react';
import {
  View,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageScrollView from './PageScrollView';

import { useThemeColors } from '../hooks/useThemeColors';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  bottomInset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle' | 'style'>;
}

/**
 * Full-screen wrapper for tab screens.
 * Uses the opaque theme background colour (not transparent) so Android can
 * hit-test the surface and scroll gestures start on the first swipe — matching
 * the same pattern used in FolderDetailScreen which has no scroll issues.
 */
export default function ScreenContainer({
  children,
  scrollable = false,
  bottomInset = 100,
  contentContainerStyle,
  scrollProps,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { background } = useThemeColors();

  const fullHeightContentStyle = React.useMemo(
    () => ({
      flexGrow: 1,
      paddingBottom: insets.bottom + bottomInset,
    }),
    [insets.bottom, bottomInset]
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }} collapsable={false}>
      {scrollable ? (
        <PageScrollView
          transparent
          style={{ flex: 1 }}
          contentContainerStyle={[fullHeightContentStyle, contentContainerStyle]}
          keyboardDismissMode="on-drag"
          {...scrollProps}
        >
          {children}
        </PageScrollView>
      ) : (
        children
      )}
    </View>
  );
}
