import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import SearchBar from '../../../components/SearchBar';
import { GridSelectionState } from '../hooks/useGridSelection';

interface GridSelectionBarProps {
  selection: GridSelectionState;
  onClear: () => void;
  onSelectAll: () => void;
  onDelete: () => void;
}

export default function GridSelectionBar({
  selection,
  onClear,
  onSelectAll,
  onDelete,
}: GridSelectionBarProps) {
  const { primary, danger, muted } = useThemeColors();

  return (
    <View className="mt-3 bg-card dark:bg-card-dark border border-primary/30 rounded-2xl px-3 py-2.5 shadow-sm">
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={onClear}
          activeOpacity={0.7}
          className="flex-row items-center px-2 py-1.5 rounded-lg bg-border/20"
        >
          <Ionicons name="close" size={16} color={muted} />
          <Text className="text-xs font-bold text-muted dark:text-muted-dark ml-1">Cancel</Text>
        </TouchableOpacity>

        <Text className="text-xs font-black text-text dark:text-text-dark">
          {selection.count} of {selection.total} selected
        </Text>

        <View className="flex-row items-center" style={{ gap: 6 }}>
          <TouchableOpacity
            onPress={selection.allSelected ? onClear : onSelectAll}
            activeOpacity={0.7}
            className="px-3 h-9 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center"
          >
            <Text className="text-[10px] font-black text-primary">
              {selection.allSelected ? 'Unselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            disabled={selection.count === 0}
            activeOpacity={0.7}
            className={`w-9 h-9 rounded-xl items-center justify-center ${
              selection.count > 0 ? 'bg-red-500/15 border border-red-500/30' : 'bg-border/20'
            }`}
          >
            <Ionicons name="trash-outline" size={18} color={selection.count > 0 ? danger : muted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
