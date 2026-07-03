import { Platform, ViewStyle } from 'react-native';

/**
 * Nearly invisible fill — Android ignores fully transparent views for touch,
 * which makes scroll gaps feel dead until you swipe many times. Kept at ~2% so
 * it's imperceptible over the app background but reliably hit-tested on Android.
 * Only applied on Android; web and iOS scroll transparent areas fine.
 */
export const SCROLL_GAP_TOUCH: ViewStyle =
  Platform.OS === 'android' ? { backgroundColor: 'rgba(0,0,0,0.02)' } : {};

/** Shared props for vertical scroll lists. */
export const SCROLL_LIST_PROPS = {
  showsVerticalScrollIndicator: false,
  keyboardShouldPersistTaps: 'handled' as const,
  scrollEventThrottle: 16,
  overScrollMode: 'always' as const,
  removeClippedSubviews: false,
  decelerationRate: 'normal' as const,
};

/**
 * Detaching off-screen rows keeps the native view tree light while scrolling
 * (each ingredient row has an image + a TextInput stepper, so this matters).
 * Android-only: react-native-web can blank content and iOS handles it natively.
 */
const REMOVE_CLIPPED = Platform.OS === 'android';

/**
 * Virtualization tuning for the ingredient list (single-column FlatList).
 * A wide render window keeps enough rows mounted above/below the viewport so
 * fast flings don't show blank cells, while still virtualizing far-off rows to
 * stay smooth. Fixed row heights + getItemLayout keep scroll offsets correct.
 */
export const LIST_VIRTUALIZATION_PROPS = {
  initialNumToRender: 12,
  maxToRenderPerBatch: 12,
  windowSize: 11,
  updateCellsBatchingPeriod: 30,
  removeClippedSubviews: REMOVE_CLIPPED,
};

/** Virtualization tuning for the 3-column grid (each row batches 3 cards). */
export const GRID_VIRTUALIZATION_PROPS = {
  initialNumToRender: 8,
  maxToRenderPerBatch: 8,
  windowSize: 11,
  updateCellsBatchingPeriod: 30,
  removeClippedSubviews: REMOVE_CLIPPED,
};

/** Let scroll win over card/button presses when the finger moves vertically. */
export const SCROLL_PRESS_DELAY_MS = 130;
