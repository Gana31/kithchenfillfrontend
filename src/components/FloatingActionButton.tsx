import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** When true, offsets the button to sit above the floating tab bar. */
  aboveTabBar?: boolean;
}

// Approx height of the floating tab bar pill (padding + icon + label).
const TAB_BAR_HEIGHT = 66;

export default function FloatingActionButton({
  onPress,
  icon = 'add',
  aboveTabBar = true,
}: FloatingActionButtonProps) {
  const insets = useSafeAreaInsets();
  const { primary } = useThemeColors();

  const base = insets.bottom + (Platform.OS === 'ios' ? 12 : 16);
  const bottom = aboveTabBar ? base + TAB_BAR_HEIGHT + 12 : base + 8;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      style={[styles.fab, { bottom, backgroundColor: primary }]}
    >
      <Ionicons name={icon} size={28} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 30,
  },
});
