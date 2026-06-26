import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';

interface HeaderIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  iconSize?: number;
  color?: string;
  className?: string;
}

export default function HeaderIconButton({
  icon,
  onPress,
  iconSize = 22,
  color,
  className = '',
}: HeaderIconButtonProps) {
  const { primary } = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`w-10 h-10 rounded-xl bg-card dark:bg-card-dark border border-border dark:border-border-dark justify-center items-center shadow-sm ${className}`}
    >
      <Ionicons name={icon} size={iconSize} color={color ?? primary} />
    </TouchableOpacity>
  );
}
