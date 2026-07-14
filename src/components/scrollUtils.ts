import { Platform, ViewStyle, Appearance } from 'react-native';

/**
 * Opaque fill for gap/separator Views on Android.
 *
 * Android requires a View to have at least some opaque pixels to register as
 * a valid touch target. rgba(0,0,0,0.02) (the old value) is below the
 * hit-test threshold on most Android devices, making the gaps between cards
 * in a ScrollView feel like dead zones where scrolling never starts.
 *
 * We use the actual app background colour so the spacer is visually invisible
 * while still being fully opaque and hit-testable by Android's native layer.
 */
const _isDark = Appearance.getColorScheme() === 'dark';
export const SCROLL_GAP_TOUCH: ViewStyle =
  Platform.OS === 'android'
    ? { backgroundColor: _isDark ? '#09090A' : '#FFFFFF' }
    : {};

/** Shared props for vertical scroll lists. */
export const SCROLL_LIST_PROPS = {
  showsVerticalScrollIndicator: false,
  keyboardShouldPersistTaps: 'handled' as const,
  scrollEventThrottle: 16,
  overScrollMode: 'always' as const,
  removeClippedSubviews: false,
  decelerationRate: 'normal' as const,
  nestedScrollEnabled: Platform.OS === 'android',
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
