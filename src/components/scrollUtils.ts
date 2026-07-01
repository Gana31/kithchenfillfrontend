import { ViewStyle } from 'react-native';

/**
 * Nearly invisible fill — Android ignores fully transparent views for touch,
 * which makes scroll gaps feel dead until you swipe many times.
 */
export const SCROLL_GAP_TOUCH: ViewStyle = {
  backgroundColor: 'rgba(0,0,0,0.006)',
};

/** Shared props for vertical scroll lists. */
export const SCROLL_LIST_PROPS = {
  showsVerticalScrollIndicator: false,
  keyboardShouldPersistTaps: 'handled' as const,
  scrollEventThrottle: 16,
  overScrollMode: 'always' as const,
  removeClippedSubviews: false,
  decelerationRate: 'normal' as const,
};

/** Let scroll win over card/button presses when the finger moves vertically. */
export const SCROLL_PRESS_DELAY_MS = 130;
