import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../config/constants';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  className?: string;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  className = '',
}: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      className={`w-full h-12 rounded-xl items-center justify-center shadow-lg active:opacity-90 ${
        isPrimary ? 'bg-primary' : 'bg-card dark:bg-card-dark border border-border dark:border-border-dark'
      }  ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : COLORS.primary} size="small" />
      ) : (
        <Text
          className={`text-sm font-extrabold tracking-wider uppercase ${
            isPrimary ? 'text-white' : 'text-text dark:text-text-dark'
          }`}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
