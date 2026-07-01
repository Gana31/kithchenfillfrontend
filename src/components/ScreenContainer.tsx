import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  View,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  StyleSheet,
} from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCROLL_LIST_PROPS } from './scrollUtils';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  /** Use RNGH ScrollView — better scroll when dragging over inputs/buttons in forms. */
  gestureScroll?: boolean;
  bottomInset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle' | 'style'>;
}

type ScreenScrollStyleContextValue = {
  contentContainerStyle: ViewStyle;
};

const ScreenScrollStyleContext = createContext<ScreenScrollStyleContextValue | null>(null);

/**
 * Read the measured full-height content style from the nearest ScreenContainer.
 * Useful for FlatList screens that manage their own scroll view.
 */
export function useScreenScrollContentStyle() {
  return useContext(ScreenScrollStyleContext);
}

function useFullHeightContentStyle(bottomInset = 100) {
  const insets = useSafeAreaInsets();
  const [containerHeight, setContainerHeight] = useState(0);

  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  }, []);

  const contentContainerStyle = useMemo(
    () => ({
      flexGrow: 1,
      paddingBottom: insets.bottom + bottomInset,
      ...(containerHeight > 0 ? { minHeight: containerHeight } : null),
    }),
    [containerHeight, insets.bottom, bottomInset]
  );

  return { onContainerLayout, contentContainerStyle };
}

/**
 * Full-screen wrapper for tab screens. Uses native ScrollView (not gesture-handler)
 * so scroll and card taps don't fight each other. Gaps stay visually transparent.
 */
export default function ScreenContainer({
  children,
  scrollable = false,
  gestureScroll = false,
  bottomInset = 100,
  contentContainerStyle,
  scrollProps,
}: ScreenContainerProps) {
  const { onContainerLayout, contentContainerStyle: fullHeightContentStyle } =
    useFullHeightContentStyle(bottomInset);

  const scrollStyleContextValue = useMemo(
    () => ({ contentContainerStyle: fullHeightContentStyle }),
    [fullHeightContentStyle]
  );

  const ScrollComponent = gestureScroll ? GestureScrollView : ScrollView;

  return (
    <ScreenScrollStyleContext.Provider value={scrollStyleContextValue}>
      <View style={styles.root} onLayout={onContainerLayout} collapsable={false}>
        {scrollable ? (
          <ScrollComponent
            style={styles.scroll}
            contentContainerStyle={[fullHeightContentStyle, contentContainerStyle]}
            alwaysBounceVertical
            {...SCROLL_LIST_PROPS}
            {...(gestureScroll ? { keyboardDismissMode: 'on-drag' as const } : null)}
            {...scrollProps}
          >
            <View
              style={styles.scrollBody}
              collapsable={false}
              pointerEvents={gestureScroll ? 'auto' : 'box-none'}
            >
              {children}
            </View>
          </ScrollComponent>
        ) : (
          children
        )}
      </View>
    </ScreenScrollStyleContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollBody: {
    width: '100%',
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
});
