import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  View,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
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
      paddingBottom: insets.bottom + bottomInset,
      ...(containerHeight > 0 ? { minHeight: containerHeight } : null),
    }),
    [containerHeight, insets.bottom, bottomInset]
  );

  return { onContainerLayout, contentContainerStyle };
}

/**
 * Plain full-screen wrapper for tab screens.
 * Keeps scroll/touch handling reliable over the transparent blob background.
 */
export default function ScreenContainer({
  children,
  scrollable = false,
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

  return (
    <ScreenScrollStyleContext.Provider value={scrollStyleContextValue}>
      <View style={{ flex: 1 }} onLayout={onContainerLayout} collapsable={false}>
        {scrollable ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[fullHeightContentStyle, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            alwaysBounceVertical
            overScrollMode="always"
            {...scrollProps}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </View>
    </ScreenScrollStyleContext.Provider>
  );
}
