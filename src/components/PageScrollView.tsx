import React from 'react';
import { ScrollView, ScrollViewProps, StyleProp, ViewStyle, Platform } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * Full-page scroll view for tab screens.
 *
 * Key decisions:
 *
 * 1. Plain RN ScrollView (not gesture-handler's ScrollView).
 *    The gesture-handler ScrollView's internal PanGestureHandler conflicts
 *    with React Navigation's gesture recognisers on Android and enters a
 *    deadlock state after 2–3 scrolls.
 *
 * 2. Wrapped in NativeViewGestureHandler.
 *    The GestureHandlerRootView at the app root intercepts ALL touches and
 *    routes them through RNGH's state machine. For plain RN ScrollViews
 *    inside tab screens, RNGH does not automatically defer to the native
 *    scroll gesture — it evaluates all registered handlers first, which can
 *    cause the scroll gesture to be dropped.
 *    NativeViewGestureHandler explicitly registers this ScrollView as a
 *    "native handler" in RNGH's state machine, so RNGH defers to it
 *    immediately instead of racing against it.
 *
 * 3. flexGrow: 1 always on contentContainerStyle.
 *    With flexGrow: 0 the content container only grows to wrap its children.
 *    If there is any padding area not covered by a child View, that area has
 *    no opaque hit-testable surface on Android and scroll gestures starting
 *    there are silently dropped. flexGrow: 1 ensures the content container
 *    always fills the full scroll area so every pixel is hit-testable.
 *
 * 4. Transparent Background low-alpha touch capture on Android.
 *    On Android, if a ScrollView (or its content container) has a fully transparent
 *    background, native hit-testing passes touch events through it to the views
 *    behind. Touches on empty spaces/gaps between children never register on the ScrollView.
 *    To fix this, we apply an invisible 1.5% alpha background color on Android when
 *    transparent is true. This forces Android's hit-test to capture touches for the ScrollView
 *    without covering the background gradient/blobs.
 *
 * 5. nestedScrollEnabled ensures Android dispatches scroll events correctly
 *    when the ScrollView lives inside a navigator hierarchy.
 */

export interface PageScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  /** Stretch content to at least fill the viewport (auth forms, short pages). */
  fillHeight?: boolean;
  /** Keep the surface see-through (for screens with their own background art). */
  transparent?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export default function PageScrollView({
  children,
  fillHeight = false,
  transparent = false,
  style,
  contentContainerStyle,
  ...rest
}: PageScrollViewProps) {
  const { background, isDark } = useThemeColors();
  
  // 1.5% alpha is invisible to the eye but allows Android hit-testing to register touches.
  const surface = transparent
    ? Platform.OS === 'android'
      ? isDark
        ? 'rgba(9, 9, 10, 0.015)'
        : 'rgba(255, 255, 255, 0.015)'
      : 'transparent'
    : background;

  return (
    <NativeViewGestureHandler>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        overScrollMode="always"
        nestedScrollEnabled
        {...rest}
        style={[{ flex: 1, backgroundColor: surface }, style]}
        contentContainerStyle={[
          { backgroundColor: surface, flexGrow: 1 },
          contentContainerStyle,
        ]}
      >
        {children}
      </ScrollView>
    </NativeViewGestureHandler>
  );
}
