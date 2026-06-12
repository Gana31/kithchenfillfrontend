import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  const { muted } = useThemeColors();

  return (
    <View className="flex-row items-center bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-2xl px-4 py-3 mb-6 shadow-sm">
      <Ionicons name="search-outline" size={20} color={muted} style={{ marginRight: 10 }} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={muted}
        value={value}
        onChangeText={onChangeText}
        className="flex-1 text-sm font-semibold text-text dark:text-text-dark p-0"
        style={{ outlineStyle: 'none' } as any}
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={muted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
