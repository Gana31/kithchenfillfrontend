import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import SearchBar from '../../../components/SearchBar';
import GridSelectionBar from './GridSelectionBar';
import { GridSelectionState } from '../hooks/useGridSelection';

interface InventoryToolbarProps {
  horizontalPadding: number;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  showSortMenu: boolean;
  filterActive: boolean;
  onToggleSortMenu: () => void;
  showGridSelection: boolean;
  gridSelection: GridSelectionState;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
}

export default function InventoryToolbar({
  horizontalPadding,
  searchQuery,
  onSearchChange,
  isRefreshing,
  onRefresh,
  showSortMenu,
  filterActive,
  onToggleSortMenu,
  showGridSelection,
  gridSelection,
  onClearSelection,
  onSelectAll,
  onDeleteSelected,
}: InventoryToolbarProps) {
  const { primary, muted } = useThemeColors();

  return (
    <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 16, paddingBottom: 8 }}>
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <SearchBar value={searchQuery} onChangeText={onSearchChange} size="sm" />

        <TouchableOpacity
          onPress={onRefresh}
          disabled={isRefreshing}
          activeOpacity={0.7}
          className="h-9 w-9 rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark items-center justify-center"
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={primary} />
          ) : (
            <Ionicons name="refresh-outline" size={16} color={muted} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onToggleSortMenu}
          activeOpacity={0.7}
          className={`h-9 w-9 rounded-xl border items-center justify-center ${
            showSortMenu || filterActive
              ? 'bg-primary/15 border-primary/30'
              : 'bg-card dark:bg-card-dark border-border dark:border-border-dark'
          }`}
        >
          <Ionicons name="funnel-outline" size={16} color={showSortMenu || filterActive ? primary : muted} />
        </TouchableOpacity>
      </View>

      {showGridSelection ? (
        <GridSelectionBar
          selection={gridSelection}
          onClear={onClearSelection}
          onSelectAll={onSelectAll}
          onDelete={onDeleteSelected}
        />
      ) : null}
    </View>
  );
}
