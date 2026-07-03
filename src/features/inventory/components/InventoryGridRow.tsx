import React from 'react';
import { View } from 'react-native';
import { IngredientData } from '../inventoryApi';
import { GridRowData } from '../hooks/useInventoryList';
import { GRID_COLUMNS, GRID_GAP } from '../inventoryUtils';
import { SCROLL_GAP_TOUCH } from '../../../components/scrollUtils';
import IngredientGridCard from './IngredientGridCard';

export interface InventoryGridRowProps {
  row: GridRowData;
  cardWidth: number;
  horizontalPadding: number;
  gridCardHeight: number;
  gridItemStride: number;
  selectionMode: boolean;
  selectedIds: ReadonlySet<string>;
  isSyncing: (id: string) => boolean;
  onEdit: (ingredient: IngredientData) => void;
  onLongPress: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onStepAdjust: (id: string, type: 'add' | 'deduct', amount: number) => void;
}

function InventoryGridRow({
  row,
  cardWidth,
  horizontalPadding,
  gridCardHeight,
  gridItemStride,
  selectionMode,
  selectedIds,
  isSyncing,
  onEdit,
  onLongPress,
  onToggleSelect,
  onStepAdjust,
}: InventoryGridRowProps) {
  const emptySlots = GRID_COLUMNS - row.items.length;
  const spacerWidth = emptySlots > 0 ? emptySlots * cardWidth + (emptySlots - 1) * GRID_GAP : 0;

  return (
    <View
      style={{
        width: '100%',
        height: gridItemStride,
        paddingBottom: GRID_GAP,
        paddingHorizontal: horizontalPadding,
        ...SCROLL_GAP_TOUCH,
      }}
      collapsable={false}
    >
      <View
        style={{ flexDirection: 'row', width: '100%', height: gridCardHeight, alignItems: 'stretch' }}
        collapsable={false}
      >
        {row.items.map((item, index) => (
          <View
            key={item._id}
            style={{ paddingRight: index < row.items.length - 1 ? GRID_GAP : 0, ...SCROLL_GAP_TOUCH }}
          >
            <IngredientGridCard
              ingredient={item}
              cardWidth={cardWidth}
              cardHeight={gridCardHeight}
              isUpdating={isSyncing(item._id)}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(item._id)}
              onEdit={onEdit}
              onLongPress={onLongPress}
              onToggleSelect={onToggleSelect}
              onStepAdjust={onStepAdjust}
            />
          </View>
        ))}
        {spacerWidth > 0 ? (
          <View style={{ width: spacerWidth, height: gridCardHeight, ...SCROLL_GAP_TOUCH }} collapsable={false} />
        ) : null}
      </View>
    </View>
  );
}

function rowItemsEqual(prev: IngredientData[], next: IngredientData[]) {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i += 1) {
    const a = prev[i];
    const b = next[i];
    if (
      a._id !== b._id ||
      a.currentStock !== b.currentStock ||
      a.image !== b.image ||
      a.purchasePrice !== b.purchasePrice
    ) {
      return false;
    }
  }
  return true;
}

function propsAreEqual(prev: InventoryGridRowProps, next: InventoryGridRowProps) {
  if (
    prev.row.id !== next.row.id ||
    prev.cardWidth !== next.cardWidth ||
    prev.horizontalPadding !== next.horizontalPadding ||
    prev.gridCardHeight !== next.gridCardHeight ||
    prev.gridItemStride !== next.gridItemStride ||
    prev.selectionMode !== next.selectionMode ||
    prev.onEdit !== next.onEdit ||
    prev.onLongPress !== next.onLongPress ||
    prev.onToggleSelect !== next.onToggleSelect ||
    prev.onStepAdjust !== next.onStepAdjust ||
    prev.isSyncing !== next.isSyncing
  ) {
    return false;
  }

  if (!rowItemsEqual(prev.row.items, next.row.items)) {
    return false;
  }

  for (const item of prev.row.items) {
    if (prev.selectedIds.has(item._id) !== next.selectedIds.has(item._id)) {
      return false;
    }
    if (prev.isSyncing(item._id) !== next.isSyncing(item._id)) {
      return false;
    }
  }

  return true;
}

export default React.memo(InventoryGridRow, propsAreEqual);
