import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardTypeOptions, TouchableOpacity } from 'react-native';
import { useAppSelector } from '../store/store';
import { selectIsDark } from '../store/themeSlice';
import { COLORS } from '../config/constants';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  className?: string;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  maxLength,
  className = '',
}: InputProps) {
  const isDark = useAppSelector(selectIsDark);
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View className={`mb-5 w-full ${className}`}>
      <Text className="text-text dark:text-text-dark text-sm font-bold mb-2 tracking-wide">{label}</Text>
      <View className="relative w-full justify-center">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry ? !isPasswordVisible : false}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          style={{ minHeight: 56, paddingHorizontal: 20, paddingRight: 65, textAlignVertical: 'center' }}
          className="w-full bg-background dark:bg-background-dark text-text dark:text-text-dark border border-border dark:border-border-dark rounded-2xl py-3.5 text-base focus:border-primary"
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={{ position: 'absolute', right: 18 }}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
            className="py-1 px-2"
          >
            <Text className="text-[10px] font-semibold text-primary tracking-normal">
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
