import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../store/store';
import { selectImpersonatedBusinessName } from '../features/auth/authSlice';
import { useThemeColors } from '../hooks/useThemeColors';

interface ImpersonationBannerProps {
  onExit: () => void;
}

export default function ImpersonationBanner({ onExit }: ImpersonationBannerProps) {
  const insets = useSafeAreaInsets();
  const businessName = useAppSelector(selectImpersonatedBusinessName);
  const { primary } = useThemeColors();

  if (!businessName) return null;

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-primary/15 border-b border-primary/25 px-4 py-2.5"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          <Ionicons name="eye-outline" size={16} color={primary} style={{ marginRight: 8 }} />
          <View className="flex-1">
            <Text className="text-[10px] font-semibold uppercase text-primary tracking-wider">
              Managing workspace
            </Text>
            <Text className="text-xs font-bold text-text dark:text-text-dark" numberOfLines={1}>
              {businessName}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onExit}
          activeOpacity={0.8}
          className="px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 flex-row items-center"
        >
          <Ionicons name="close" size={14} color={primary} style={{ marginRight: 4 }} />
          <Text className="text-[10px] font-semibold uppercase text-primary tracking-wider">Exit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
