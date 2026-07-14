import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../store/store';
import { selectIsDark } from '../store/themeSlice';
import { COLORS } from '../config/constants';

interface AnimatedTabItemProps {
  routeKey: string;
  routeName: string;
  label: string;
  isFocused: boolean;
  isDark: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function AnimatedTabItem({
  routeName,
  label,
  isFocused,
  isDark,
  onPress,
  onLongPress,
}: AnimatedTabItemProps) {
  const scaleVal = useRef(new Animated.Value(isFocused ? 1.08 : 1)).current;
  const opacityVal = useRef(new Animated.Value(isFocused ? 1 : 0.75)).current;
  const activeBarWidth = useRef(new Animated.Value(isFocused ? 14 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleVal, {
        toValue: isFocused ? 1.1 : 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityVal, {
        toValue: isFocused ? 1 : 0.75,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(activeBarWidth, {
        toValue: isFocused ? 14 : 0,
        friction: 8,
        tension: 120,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused]);

  let iconName: keyof typeof Ionicons.glyphMap = 'cube-outline';
  if (routeName.toLowerCase().includes('dashboard')) {
    iconName = isFocused ? 'grid' : 'grid-outline';
  } else if (
    routeName.toLowerCase().includes('owner') ||
    routeName.toLowerCase().includes('user') ||
    routeName.toLowerCase().includes('manage')
  ) {
    iconName = isFocused ? 'people' : 'people-outline';
  } else if (routeName.toLowerCase().includes('inventory')) {
    iconName = isFocused ? 'cube' : 'cube-outline';
  } else if (routeName.toLowerCase().includes('recipe')) {
    iconName = isFocused ? 'restaurant' : 'restaurant-outline';
  } else if (routeName.toLowerCase().includes('plate')) {
    iconName = isFocused ? 'fast-food' : 'fast-food-outline';
  } else if (routeName.toLowerCase().includes('udhaar')) {
    iconName = isFocused ? 'cash' : 'cash-outline';
  } else if (routeName.toLowerCase().includes('profile')) {
    iconName = isFocused ? 'person' : 'person-outline';
  }

  const activeColor = '#FF6B00';
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(24, 24, 27, 0.6)';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      android_ripple={null}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleVal }],
          opacity: opacityVal,
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 50,
        }}
      >
        <Ionicons name={iconName} size={20} color={isFocused ? activeColor : inactiveColor} />
        <Text
          style={{
            color: isFocused ? activeColor : inactiveColor,
            fontSize: 9,
            fontWeight: '600',
            marginTop: 2,
            textTransform: 'capitalize',
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
        <Animated.View
          style={{
            width: activeBarWidth,
            height: 2,
            borderRadius: 1,
            backgroundColor: isFocused ? activeColor : 'transparent',
            marginTop: 3,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const isDark = useAppSelector(selectIsDark);
  const systemNavColor = isDark ? COLORS.dark.background : COLORS.light.background;
  const tabBarHeight = 64 + insets.bottom;

  return (
    <View
      pointerEvents="box-none"
      style={{
        height: tabBarHeight,
        width: '100%',
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
      }}
    >
      {/* Floating Pill Container (Fully within bounds of the tab bar) */}
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(10, 10, 12, 0.92)' : 'rgba(255, 255, 255, 0.92)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(24, 24, 27, 0.08)',
            marginTop: 4,
            marginBottom: insets.bottom > 0 ? 4 : 10,
          },
        ]}
      >
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (isFocused) {
                if (route.name === 'Inventory') {
                  (navigation as { emit: (event: { type: string; target: string }) => void }).emit({
                    type: 'inventoryTabRepress',
                    target: route.key,
                  });
                } else if (route.name === 'Recipes') {
                  (navigation as { emit: (event: { type: string; target: string }) => void }).emit({
                    type: 'recipesTabRepress',
                    target: route.key,
                  });
                }
                return;
              }

              if (!event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <AnimatedTabItem
                key={route.key}
                routeKey={route.key}
                routeName={route.name}
                label={label.toString()}
                isFocused={isFocused}
                isDark={isDark}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </View>

      {/* System Nav Area Fill */}
      {insets.bottom > 0 ? (
        <View
          pointerEvents="none"
          style={{
            height: insets.bottom,
            width: '100%',
            backgroundColor: systemNavColor,
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: Platform.OS === 'android' ? 0 : 8,
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
