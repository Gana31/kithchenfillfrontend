import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/store';
import { hideToast } from '../store/toastSlice';
import { COLORS } from '../config/constants';

export default function Toast() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { visible, message, type, title } = useAppSelector((state) => state.toast);
  
  // Animating translateY offset from top: 0
  const slideAnim = useRef(new Animated.Value(-180)).current;

  useEffect(() => {
    if (visible) {
      // Spring animate slide-down entry
      Animated.spring(slideAnim, {
        toValue: insets.top + 12,
        useNativeDriver: true,
        tension: 70,
        friction: 8,
      }).start();

      // Auto dismiss after 3.2 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3200);

      return () => clearTimeout(timer);
    } else {
      // Slide back up out of view
      Animated.timing(slideAnim, {
        toValue: -180,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, insets.top]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -180,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dispatch(hideToast());
    });
  };

  // Skip rendering if not visible and animation has reset
  if (!visible && (slideAnim as any)._value === -180) {
    return null;
  }

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: COLORS.success,
          bg: 'border-emerald-500/25 bg-card/98 dark:bg-card-dark/98',
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          color: COLORS.danger,
          bg: 'border-red-500/25 bg-card/98 dark:bg-card-dark/98',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: COLORS.primary,
          bg: 'border-primary/25 bg-card/98 dark:bg-card-dark/98',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      className={`border rounded-2xl p-4 flex-row items-center shadow-xl ${config.bg}`}
    >
      {/* Type-Specific Status Icon */}
      <Ionicons name={config.icon} size={22} color={config.color} style={styles.icon} />

      {/* Message and Optional Title */}
      <View className="flex-1 mr-2">
        {title ? (
          <Text className="text-[10px] font-black text-text dark:text-text-dark uppercase tracking-widest mb-0.5">
            {title}
          </Text>
        ) : null}
        <Text className="text-xs font-black text-text dark:text-text-dark leading-relaxed">
          {message}
        </Text>
      </View>

      {/* Manual Dismiss Button */}
      <TouchableOpacity 
        onPress={handleDismiss} 
        activeOpacity={0.7} 
        className="p-1 rounded-lg bg-border/20 dark:bg-border-dark/20"
      >
        <Ionicons name="close" size={13} color={type === 'success' ? COLORS.success : type === 'error' ? COLORS.danger : COLORS.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  icon: {
    marginRight: 12,
  },
});
