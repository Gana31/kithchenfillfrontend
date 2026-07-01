import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { SortOption, StockLevelFilter, SORT_OPTIONS, STOCK_LEVEL_FILTER_OPTIONS } from '../inventoryUtils';

interface InventorySortMenuProps {
  visible: boolean;
  sortBy: SortOption;
  stockFilter: StockLevelFilter;
  horizontalPadding: number;
  topInset: number;
  onClose: () => void;
  onSortChange: (sort: SortOption) => void;
  onStockFilterChange: (filter: StockLevelFilter) => void;
}

export default function InventorySortMenu({
  visible,
  sortBy,
  stockFilter,
  horizontalPadding,
  topInset,
  onClose,
  onSortChange,
  onStockFilterChange,
}: InventorySortMenuProps) {
  const { primary, muted, danger, success } = useThemeColors();

  const stockFilterIconColor = (value: StockLevelFilter, selected: boolean) => {
    if (!selected) return muted;
    if (value === 'all') return primary;
    if (value === 'low') return danger;
    if (value === 'average') return '#ca8a04';
    return success;
  };

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
            className="w-60 bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl p-1.5 shadow-lg"
            style={{ elevation: 12 }}
          >
            <Text className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-muted-dark px-2.5 pt-1.5 pb-1">
              Sort by
            </Text>
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

            <View className="h-px bg-border dark:bg-border-dark mx-2 my-1" />

            <Text className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-muted-dark px-2.5 pt-1 pb-1">
              Stock level
            </Text>
            {STOCK_LEVEL_FILTER_OPTIONS.map((option) => {
              const selected = stockFilter === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => onStockFilterChange(option.value)}
                  activeOpacity={0.7}
                  className={`flex-row items-center px-2.5 py-2.5 rounded-lg ${
                    selected ? (option.value === 'all' ? 'bg-primary/10' : option.accentClass) : ''
                  }`}
                >
                  <Ionicons
                    name={option.icon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={stockFilterIconColor(option.value, selected)}
                  />
                  <Text
                    className={`text-xs font-bold ml-2 flex-1 ${
                      selected
                        ? option.value === 'all'
                          ? 'text-primary'
                          : option.textClass
                        : 'text-text dark:text-text-dark'
                    }`}
                  >
                    {option.label}
                  </Text>
                  {selected ? (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={stockFilterIconColor(option.value, true)}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
