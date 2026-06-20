import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../store/store';
import { selectIsDark } from '../store/themeSlice';

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
  // Spring animation values for bouncy icon/label feedback
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
        useNativeDriver: false, // Width animations require layout, cannot use native driver
      }),
    ]).start();
  }, [isFocused]);

  // Map route names to icons
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
  } else if (
    routeName.toLowerCase().includes('sales') || 
    routeName.toLowerCase().includes('log') || 
    routeName.toLowerCase().includes('counter')
  ) {
    iconName = isFocused ? 'receipt' : 'receipt-outline';
  } else if (routeName.toLowerCase().includes('profile')) {
    iconName = isFocused ? 'person' : 'person-outline';
  }

  const activeColor = '#FF6B00';
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(24, 24, 27, 0.6)';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      className="items-center justify-center flex-1"
      activeOpacity={0.75}
    >
      <Animated.View 
        style={{ 
          transform: [{ scale: scaleVal }], 
          opacity: opacityVal,
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 50
        }}
      >
        <Ionicons
          name={iconName}
          size={21}
          color={isFocused ? activeColor : inactiveColor}
        />
        <Text
          style={{
            color: isFocused ? activeColor : inactiveColor,
            fontSize: 9,
            fontWeight: isFocused ? '900' : '600',
            marginTop: 3,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {label}
        </Text>
        
        {/* Active indicator bar - spring expanding */}
        <Animated.View 
          style={{
            width: activeBarWidth,
            height: 2.5,
            borderRadius: 1.25,
            backgroundColor: isFocused ? activeColor : 'transparent',
            marginTop: 4,
          }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const isDark = useAppSelector(selectIsDark);
  
  // Calculate bottom margin to float safely above system navigation bar or home indicator.
  const bottomMargin = insets.bottom + (Platform.OS === 'ios' ? 12 : 16);

  return (
    <View 
      style={[
        styles.container, 
        { 
          bottom: bottomMargin,
          backgroundColor: isDark ? 'rgba(10, 10, 12, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(24, 24, 27, 0.08)',
        }
      ]}
    >
      <View className="flex-row justify-around items-center w-full px-2 py-3">
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
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});
