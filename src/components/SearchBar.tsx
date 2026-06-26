import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  size = 'md',
  className = '',
}: SearchBarProps) {
  const { muted, text } = useThemeColors();
  const isCompact = size === 'sm';

  return (
    <View
      className={`flex-row items-center bg-card dark:bg-card-dark border border-border dark:border-border-dark shadow-sm ${
        isCompact ? 'flex-1 rounded-xl px-3 py-2' : 'rounded-2xl px-4 py-3 mb-6'
      } ${className}`}
    >
      <Ionicons
        name="search-outline"
        size={isCompact ? 16 : 20}
        color={muted}
        style={{ marginRight: isCompact ? 6 : 10 }}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={muted}
        className={isCompact ? undefined : 'flex-1 text-sm font-semibold text-text dark:text-text-dark p-0'}
        style={
          isCompact
            ? {
                flex: 1,
                fontSize: 13,
                fontWeight: '600',
                color: text,
                paddingVertical: 0,
              }
            : ({ outlineStyle: 'none' } as any)
        }
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={isCompact ? 16 : 18} color={muted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
