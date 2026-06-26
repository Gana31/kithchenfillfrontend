import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { SortOption, SORT_OPTIONS } from '../inventoryUtils';

interface InventorySortMenuProps {
  visible: boolean;
  sortBy: SortOption;
  horizontalPadding: number;
  topInset: number;
  onClose: () => void;
  onSortChange: (sort: SortOption) => void;
}

export default function InventorySortMenu({
  visible,
  sortBy,
  horizontalPadding,
  topInset,
  onClose,
  onSortChange,
}: InventorySortMenuProps) {
  const { primary, muted } = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.35)',
          }}
          onPress={onClose}
        />
        <View
          style={{
            paddingTop: topInset + 108,
            paddingHorizontal: horizontalPadding,
            alignItems: 'flex-end',
          }}
          pointerEvents="box-none"
        >
          <View
            className="w-56 bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl p-1.5 shadow-lg"
            style={{ elevation: 12 }}
          >
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => onSortChange(option.value)}
                activeOpacity={0.7}
                className={`flex-row items-center px-2.5 py-2.5 rounded-lg ${sortBy === option.value ? 'bg-primary/10' : ''}`}
              >
                <Ionicons
                  name={option.icon as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={sortBy === option.value ? primary : muted}
                />
                <Text
                  className={`text-xs font-bold ml-2 flex-1 ${sortBy === option.value ? 'text-primary' : 'text-text dark:text-text-dark'}`}
                >
                  {option.label}
                </Text>
                {sortBy === option.value ? (
                  <Ionicons name="checkmark" size={14} color={primary} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
