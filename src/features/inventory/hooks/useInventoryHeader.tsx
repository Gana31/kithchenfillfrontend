import { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import HeaderIconButton from '../../../components/HeaderIconButton';
import { InventoryLayout } from '../inventoryUtils';

interface UseInventoryHeaderOptions {
  navigation: { setOptions: (options: object) => void };
  prefsLoaded: boolean;
  layout: InventoryLayout;
  lowStockCount: number;
  onLayoutChange: (layout: InventoryLayout) => void;
  onAddPress: () => void;
}

function LowStockBadge({ count }: { count: number }) {
  const { danger, muted } = useThemeColors();
  const hasLowStock = count > 0;

  return (
    <View
      className={`flex-row items-center rounded-xl px-2.5 h-9 border ${
        hasLowStock ? 'bg-red-500/10 border-red-500/25' : 'bg-card dark:bg-card-dark border-border dark:border-border-dark'
      }`}
      style={{ gap: 4 }}
    >
      <Ionicons name="warning" size={14} color={hasLowStock ? danger : muted} />
      <Text className={`text-[11px] font-black ${hasLowStock ? 'text-red-500' : 'text-muted dark:text-muted-dark'}`}>
        {count}
      </Text>
    </View>
  );
}

export function useInventoryHeader({
  navigation,
  prefsLoaded,
  layout,
  lowStockCount,
  onLayoutChange,
  onAddPress,
}: UseInventoryHeaderOptions) {
  const { primary, muted } = useThemeColors();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (prefsLoaded ? <LowStockBadge count={lowStockCount} /> : null),
      headerRight: () => (
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {prefsLoaded ? (
            <View className="flex-row bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl p-0.5">
              <TouchableOpacity
                onPress={() => onLayoutChange('list')}
                activeOpacity={0.7}
                className={`w-9 h-9 rounded-lg justify-center items-center ${layout === 'list' ? 'bg-primary/15' : ''}`}
              >
                <Ionicons name="list-outline" size={18} color={layout === 'list' ? primary : muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onLayoutChange('grid')}
                activeOpacity={0.7}
                className={`w-9 h-9 rounded-lg justify-center items-center ${layout === 'grid' ? 'bg-primary/15' : ''}`}
              >
                <Ionicons name="grid-outline" size={18} color={layout === 'grid' ? primary : muted} />
              </TouchableOpacity>
            </View>
          ) : null}
          <HeaderIconButton icon="add" onPress={onAddPress} />
        </View>
      ),
    });
  }, [navigation, primary, muted, layout, prefsLoaded, lowStockCount, onLayoutChange, onAddPress]);
}
